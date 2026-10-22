/**
 * Vendored skills совпадают с upstream.
 *
 * Skills из `skills-lock.json` ставит `npx skills add` и записывает хеш папки. Правка на месте теряется
 * при следующем обновлении, поэтому адаптацию пишут в `docs/agents/` или в project-owned skill рядом.
 * Хеш считается как в CLI `skills`: sha256 по файлам папки, отсортированным по пути, — путь и содержимое.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SKILLS_DIR = ".agents/skills";
const LOCK_FILE = "skills-lock.json";

interface LockEntry {
	source: string;
	computedHash: string;
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
const problems: string[] = [];

for (const [name, entry] of Object.entries(lock.skills)) {
	const skillDir = path.join(SKILLS_DIR, name);
	if (!existsSync(skillDir)) {
		problems.push(`${skillDir}: папки нет, а в ${LOCK_FILE} skill есть`);
		continue;
	}
	if (computeSkillFolderHash(skillDir) !== entry.computedHash) {
		problems.push(
			`${skillDir}: изменён на месте. Верни upstream: \`git checkout -- ${skillDir}\`, новые файлы в папке удали; ` +
				`адаптацию пиши в docs/agents/ или в project-owned skill рядом. ` +
				`Обновление из upstream — \`npx -y skills add ${entry.source} --skill ${name} -a codex --copy -y\`: ` +
				`оно перепишет и папку, и хеш.`,
		);
	}
}

if (problems.length > 0) {
	console.error(
		`Vendored skills не совпадают с ${LOCK_FILE}:\n${problems.map((problem) => `- ${problem}`).join("\n")}`,
	);
	process.exit(1);
}

console.log(`Vendored skills совпадают с ${LOCK_FILE}: ${Object.keys(lock.skills).length}`);
