/**
 * Оглавление в длинных документах для агентов.
 *
 * Агент часто читает у reference-файла только первые ~100 строк, чтобы решить, нужен ли он.
 * Поэтому документ длиннее `MAX_LINES_WITHOUT_TOC` строк начинается с раздела «Содержание»,
 * где перечислены все разделы `## ` по порядку.
 *
 * `--fix` создаёт или обновляет оглавление.
 */

import { globSync, readFileSync, writeFileSync } from "node:fs";
import { toAnchor } from "./markdownAnchor.mts";

const MAX_LINES_WITHOUT_TOC = 100;
const TOC_HEADING = "## Содержание";
const DOC_GLOBS = [
	"AGENTS.md",
	"CODING_STANDARDS.md",
	"docs/agents/*.md",
	"docs/engineering/*.md",
	"packages/*/docs/*.md",
	"src/features/*/docs/*.md",
];

const shouldFix = process.argv.includes("--fix");

function collectSections(lines: string[]): string[] {
	let isInCode = false;
	const sections: string[] = [];

	for (const line of lines) {
		if (line.startsWith("```")) {
			isInCode = !isInCode;
		}
		if (!isInCode && line.startsWith("## ") && line !== TOC_HEADING) {
			sections.push(line.slice(3).trim());
		}
	}

	return sections;
}

function buildToc(sections: string[]): string[] {
	return [TOC_HEADING, "", ...sections.map((section) => `- [${section}](#${toAnchor(section)})`), ""];
}

function withToc(lines: string[], toc: string[]): string[] {
	const tocStart = lines.indexOf(TOC_HEADING);

	if (tocStart !== -1) {
		const tocEnd = lines.findIndex((line, index) => index > tocStart && line.startsWith("## "));
		return [...lines.slice(0, tocStart), ...toc, ...lines.slice(tocEnd)];
	}

	const firstSection = lines.findIndex((line) => line.startsWith("## "));
	return [...lines.slice(0, firstSection), ...toc, ...lines.slice(firstSection)];
}

const errors: string[] = [];

for (const file of globSync(DOC_GLOBS)) {
	const lines = readFileSync(file, "utf8").split("\n");
	const sections = collectSections(lines);

	if (lines.length <= MAX_LINES_WITHOUT_TOC || sections.length < 2) {
		continue;
	}

	const expected = withToc(lines, buildToc(sections));

	if (expected.join("\n") === lines.join("\n")) {
		continue;
	}
	if (shouldFix) {
		writeFileSync(file, expected.join("\n"));
		console.log(`${file}: оглавление обновлено`);
		continue;
	}
	errors.push(`${file}: ${lines.length} строк — нужен актуальный раздел «Содержание» со всеми разделами ##`);
}

if (errors.length > 0) {
	console.error(errors.join("\n"));
	console.error("\nИсправить: pnpm lint:docs --fix");
	process.exit(1);
}
