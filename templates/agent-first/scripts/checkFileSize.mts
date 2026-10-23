/**
 * Файл не больше 5 000 токенов (токены ≈ байты / 4).
 *
 * Агент читает файл целиком или только начало: большой файл съедает контекст, а его середина теряется.
 * Проверяются текстовые файлы, которые пишут люди и агенты; сгенерированное, vendored skills и архив
 * `docs/plans/completed/` — нет. Файлы, которые уже больше лимита, перечислены в
 * `scripts/baselines/file-size.json` и не должны расти.
 *
 * `--update` только сужает baseline: снижает размер до текущего и убирает файлы, которые стали меньше лимита
 * или удалены. Новые файлы он не добавляет: большой новый файл надо разделить.
 *
 * `--seed` — только при установке setup в существующий проект: вносит в baseline все файлы, которые уже больше лимита.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FEATURES_DIR, SIZE_IGNORED_PREFIXES } from "./projectConfig.mts";

const MAX_TOKENS = 5000;
const BYTES_PER_TOKEN = 4;
const BASELINE_FILE = "scripts/baselines/file-size.json";
const CHECKED_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".mjs", ".js", ".jsx", ".md", ".mdx", ".css"]);
// Сгенерированные файлы: их размер задаёт генератор, а не автор. Допишите схемы API, иконки и подобное.
const GENERATED_FILES = [/(^|\/)CHANGELOG\.md$/, /(^|\/)pnpm-lock\.yaml$/];
const ARCHIVE_DIRS = ["docs/plans/completed/"];

const shouldUpdate = process.argv.includes("--update");
const shouldSeed = process.argv.includes("--seed");

function listFiles(): string[] {
	const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
		encoding: "utf8",
	});
	return output.split("\0").filter(Boolean);
}

function vendoredSkillDirs(): string[] {
	const lock = JSON.parse(readFileSync("skills-lock.json", "utf8")) as { skills: Record<string, unknown> };
	return Object.keys(lock.skills).map((name) => `.agents/skills/${name}/`);
}

function countTokens(file: string): number | null {
	try {
		return Math.ceil(statSync(file).size / BYTES_PER_TOKEN);
	} catch {
		return null;
	}
}

function splitAdvice(file: string): string {
	if (file.endsWith(".md") || file.endsWith(".mdx")) {
		return "раздели документ по темам: в нём оставь оглавление со ссылками на части (одно правило — одно место, docs/agents/setup.md, «Поддержка инструкций»)";
	}
	if (/\.test\.[^/]+$/.test(file) || file.includes("/__tests__/")) {
		return "раздели тест по сценариям: `<name>.<сценарий>.test.tsx` рядом, общие фикстуры и render-хелперы — в соседний модуль в `__tests__/`";
	}
	return `вынеси самостоятельные части в соседние модули по ролям (docs/engineering/features.md, «Раскладка внутри домена» для ${FEATURES_DIR})`;
}

const skippedPrefixes = [...ARCHIVE_DIRS, ...SIZE_IGNORED_PREFIXES, ...vendoredSkillDirs()];
const checkedFiles = listFiles().filter(
	(file) =>
		CHECKED_EXTENSIONS.has(path.extname(file)) &&
		!GENERATED_FILES.some((pattern) => pattern.test(file)) &&
		!skippedPrefixes.some((prefix) => file.startsWith(prefix)),
);
const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as Record<string, number>;

if (shouldSeed) {
	const next: Record<string, number> = { ...baseline };
	for (const file of checkedFiles) {
		const tokens = countTokens(file);
		if (tokens !== null && tokens > MAX_TOKENS) next[file] = Math.max(next[file] ?? 0, tokens);
	}
	writeFileSync(BASELINE_FILE, `${JSON.stringify(next, null, "\t")}\n`);
	console.log(`${BASELINE_FILE}: ${Object.keys(next).length} файлов больше ${MAX_TOKENS} токенов внесены в baseline.`);
	process.exit(0);
}

if (shouldUpdate) {
	const next: Record<string, number> = {};
	for (const [file, allowed] of Object.entries(baseline)) {
		const tokens = countTokens(file);
		if (tokens !== null && tokens > MAX_TOKENS) next[file] = Math.min(allowed, tokens);
	}
	writeFileSync(BASELINE_FILE, `${JSON.stringify(next, null, "\t")}\n`);
	console.log(`${BASELINE_FILE}: ${Object.keys(next).length} файлов больше ${MAX_TOKENS} токенов.`);
	process.exit(0);
}

const problems: string[] = [];

for (const file of checkedFiles) {
	const tokens = countTokens(file);
	if (tokens === null || tokens <= MAX_TOKENS) continue;
	const allowed = baseline[file];
	if (allowed === undefined) {
		problems.push(`${file}: ${tokens} токенов при лимите ${MAX_TOKENS} — ${splitAdvice(file)}.`);
	} else if (tokens > allowed) {
		problems.push(
			`${file}: вырос до ${tokens} токенов, в baseline ${allowed} — файл из baseline не растёт, ${splitAdvice(file)}.`,
		);
	}
}

for (const [file, allowed] of Object.entries(baseline)) {
	const tokens = countTokens(file);
	if (tokens === null || tokens <= MAX_TOKENS || tokens < allowed) {
		problems.push(
			`${file}: стал меньше записи в baseline — запусти \`pnpm lint:size:update\`, чтобы он не вырос обратно.`,
		);
	}
}

if (problems.length > 0) {
	console.error(
		`Файлы больше ${MAX_TOKENS} токенов (байты / ${BYTES_PER_TOKEN}):\n${problems.map((problem) => `- ${problem}`).join("\n")}`,
	);
	process.exit(1);
}

console.log(`Размер файлов в пределах ${MAX_TOKENS} токенов; в baseline ${Object.keys(baseline).length}.`);
