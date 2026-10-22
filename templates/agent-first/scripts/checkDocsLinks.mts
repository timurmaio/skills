/**
 * Относительные ссылки в Markdown ведут на существующий файл и раздел.
 *
 * Агент переходит по ссылкам из AGENTS.md и документов: битая ссылка после переезда файла или переименования
 * заголовка молча обрывает путь к правилу. Проверяются ссылки `[текст](путь#раздел)` вне блоков кода и HTML-комментариев;
 * внешние URL, шаблоны с `<…>` и ссылки на строки (`#L12`) — нет. Vendored skills, архив
 * `docs/plans/completed/` и CHANGELOG как источники ссылок не проверяются.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { toAnchor } from "./markdownAnchor.mts";

const SKIPPED_SOURCES = [/^docs\/plans\/completed\//, /(^|\/)CHANGELOG\.md$/];
const LINK_PATTERN = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
const LINE_ANCHOR = /^L\d+(-L\d+)?$/;
/** Блок кода, в том числе с отступом внутри списка. */
const FENCED_CODE = /^[ \t]*```[\s\S]*?^[ \t]*```/gm;

function vendoredSkillDirs(): string[] {
	const lock = JSON.parse(readFileSync("skills-lock.json", "utf8")) as { skills: Record<string, unknown> };
	return Object.keys(lock.skills).map((name) => `.agents/skills/${name}/`);
}

function listMarkdownFiles(): string[] {
	const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "*.md"], {
		encoding: "utf8",
	});
	return output.split("\0").filter(Boolean);
}

/** Текст без блоков кода, inline-кода и HTML-комментариев: ссылки в примерах и подсказках шаблона не настоящие. */
function withoutCode(markdown: string): string {
	return markdown
		.replaceAll(FENCED_CODE, "")
		.replaceAll(/<!--[\s\S]*?-->/g, "")
		.replaceAll(/`[^`\n]*`/g, "");
}

const anchorCache = new Map<string, Set<string>>();

function anchorsOf(file: string): Set<string> {
	const cached = anchorCache.get(file);
	if (cached) return cached;

	const text = readFileSync(file, "utf8").replaceAll(FENCED_CODE, "");
	const anchors = new Set<string>();
	const seen = new Map<string, number>();
	for (const [, heading = ""] of text.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
		const base = toAnchor(heading);
		const count = seen.get(base) ?? 0;
		anchors.add(count === 0 ? base : `${base}-${count}`);
		seen.set(base, count + 1);
	}
	for (const [, id = ""] of text.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) anchors.add(id);
	anchorCache.set(file, anchors);
	return anchors;
}

function checkLink(source: string, target: string): string | null {
	if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.includes("<") || target.includes("{")) return null;

	const [rawPath = "", rawAnchor] = target.split("#");
	const filePath = decodeURI(rawPath.split("?")[0] ?? "");
	// Ссылка с `/` — от корня репозитория, как её понимают GitLab и GitHub.
	const isFromRoot = filePath.startsWith("/");
	const relativePath = isFromRoot ? filePath.replace(/^\/+/, "") : path.join(path.dirname(source), filePath);
	const resolved = filePath ? path.normalize(relativePath) : source;

	if (!existsSync(resolved)) return `файла \`${resolved}\` нет`;
	if (!rawAnchor || LINE_ANCHOR.test(rawAnchor) || !resolved.endsWith(".md") || statSync(resolved).isDirectory()) {
		return null;
	}
	const anchor = decodeURIComponent(rawAnchor);
	return anchorsOf(resolved).has(anchor) ? null : `в \`${resolved}\` нет раздела \`#${anchor}\``;
}

const skippedPrefixes = vendoredSkillDirs();
const sources = listMarkdownFiles().filter(
	(file) =>
		!SKIPPED_SOURCES.some((pattern) => pattern.test(file)) &&
		!skippedPrefixes.some((prefix) => file.startsWith(prefix)),
);
const problems: string[] = [];
let checkedLinks = 0;

for (const source of sources) {
	for (const [, target] of withoutCode(readFileSync(source, "utf8")).matchAll(LINK_PATTERN)) {
		if (target === undefined) continue;
		checkedLinks += 1;
		const problem = checkLink(source, target);
		if (problem) problems.push(`${source}: ссылка \`${target}\` — ${problem}`);
	}
}

if (problems.length > 0) {
	console.error(
		`Битые ссылки в документации:\n${problems.map((problem) => `- ${problem}`).join("\n")}\n\n` +
			"Исправить: поставь текущий путь файла или текст заголовка; после переезда раздела обнови ссылки в том же diff.",
	);
	process.exit(1);
}

console.log(`Ссылки в документации целы: ${checkedLinks} в ${sources.length} файлах.`);
