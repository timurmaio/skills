/**
 * Vendored skills не правят на месте.
 *
 * Skills из `skills-lock.json` ставит `npx skills add`. Правка на месте теряется при следующем обновлении, поэтому
 * адаптацию пишут в `docs/agents/` или в project-owned skill рядом.
 *
 * `computedHash` из lock для сверки не годится: CLI считает его по папке skill в upstream, а при установке не копирует
 * часть файлов (`metadata.json`), так что хеш установленной копии с ним может не совпасть. Поэтому сверка идёт со
 * снимком `scripts/baselines/vendored-skills.json`: хеш установленной папки — sha256 по файлам, отсортированным
 * по пути, путь и содержимое.
 *
 * `--update` записывает снимок заново. Запускай его только сразу после `npx skills add` или `npx skills update`.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SKILLS_DIR = ".agents/skills";
const LOCK_FILE = "skills-lock.json";
const SNAPSHOT_FILE = "scripts/baselines/vendored-skills.json";

interface LockEntry {
	source: string;
}

interface SkillFile {
	relativePath: string;
	content: Buffer;
}

function collectFiles(baseDir: string, currentDir: string, results: SkillFile[]): SkillFile[] {
	for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
		const fullPath = path.join(currentDir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === ".git" || entry.name === "node_modules") continue;
			collectFiles(baseDir, fullPath, results);
		} else if (entry.isFile()) {
			const relativePath = path.relative(baseDir, fullPath).split(path.sep).join("/");
			results.push({ relativePath, content: readFileSync(fullPath) });
		}
	}
	return results;
}

function computeSkillFolderHash(skillDir: string): string {
	const files = collectFiles(skillDir, skillDir, []).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
	const hash = createHash("sha256");
	for (const file of files) {
		hash.update(file.relativePath);
		hash.update(file.content);
	}
	return hash.digest("hex");
}

const lock = JSON.parse(readFileSync(LOCK_FILE, "utf8")) as { skills: Record<string, LockEntry> };
const names = Object.keys(lock.skills).sort();

if (process.argv.includes("--update")) {
	const snapshot = Object.fromEntries(names.map((name) => [name, computeSkillFolderHash(path.join(SKILLS_DIR, name))]));
	writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(snapshot, null, "\t")}\n`);
	console.log(`${SNAPSHOT_FILE}: снимок ${names.length} vendored skills записан.`);
	process.exit(0);
}

const snapshot = existsSync(SNAPSHOT_FILE)
	? (JSON.parse(readFileSync(SNAPSHOT_FILE, "utf8")) as Record<string, string>)
	: {};
const problems: string[] = [];

for (const name of names) {
	const skillDir = path.join(SKILLS_DIR, name);
	const entry = lock.skills[name];
	if (!existsSync(skillDir)) {
		problems.push(`${skillDir}: папки нет, а в ${LOCK_FILE} skill есть`);
		continue;
	}
	if (snapshot[name] === undefined) {
		problems.push(
			`${skillDir}: нет в снимке ${SNAPSHOT_FILE}. Если skill только что поставлен через \`npx skills add\`, ` +
				"запусти `pnpm lint:skills:update`.",
		);
		continue;
	}
	if (computeSkillFolderHash(skillDir) !== snapshot[name]) {
		problems.push(
			`${skillDir}: изменён на месте. Верни upstream: \`git checkout -- ${skillDir}\`, новые файлы в папке удали; ` +
				"адаптацию пиши в docs/agents/ или в project-owned skill рядом. " +
				`Обновление из upstream — \`npx -y skills add ${entry?.source ?? "<source>"} --skill ${name} -a codex --copy -y\`, ` +
				"затем `pnpm lint:skills:update`.",
		);
	}
}

for (const name of Object.keys(snapshot)) {
	if (!names.includes(name)) problems.push(`${SNAPSHOT_FILE}: \`${name}\` нет в ${LOCK_FILE} — запусти \`pnpm lint:skills:update\`.`);
}

if (problems.length > 0) {
	console.error(`Vendored skills не совпадают со снимком:\n${problems.map((problem) => `- ${problem}`).join("\n")}`);
	process.exit(1);
}

console.log(`Vendored skills совпадают со снимком: ${names.length}`);
