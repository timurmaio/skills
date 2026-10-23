/**
 * PreToolUse для Bash: агент не пушит в защищённые ветки и не переписывает удалённую историю.
 *
 * Запрещено: push в ветку из `PROTECTED_BRANCHES` (явным refspec или из неё без refspec), `--force` без lease,
 * `+refspec`, `--all`, `--mirror`, удаление защищённой ветки. Остальной push проходит обычный permission flow:
 * `.claude/settings.json` спрашивает подтверждение. Хук разбирает команду эвристикой — граница безопасности на
 * сервере (protected branches хостинга), хук лишь не даёт агенту туда стучаться.
 */

import { execFileSync } from "node:child_process";
import { readHookInput } from "./agentState.mts";

// Ветки, куда агент не пушит никогда. `*` в конце — префикс: допиши релизные ветки проекта, например `release/*`.
const PROTECTED_BRANCHES = ["{{MAIN_BRANCH}}"];

interface PreToolUseInput {
	cwd: string;
	tool_input?: { command?: string };
}

const GIT_OPTIONS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace"]);
const PUSH_OPTIONS_WITH_VALUE = new Set(["--repo", "--receive-pack", "--exec", "-o", "--push-option"]);

try {
	const input = readHookInput<PreToolUseInput>();
	const problems = (input.tool_input?.command ? findPushCommands(input.tool_input.command) : []).flatMap((push) =>
		checkPush(push, input.cwd),
	);

	if (problems.length > 0) {
		console.log(
			JSON.stringify({
				hookSpecificOutput: {
					hookEventName: "PreToolUse",
					permissionDecision: "deny",
					permissionDecisionReason:
						`${problems.join("; ")}. Агент пушит только свою рабочую ветку и без перезаписи истории ` +
						"(docs/engineering/delivery.md, «Authority»); защищённые ветки меняет человек через MR/PR.",
				},
			}),
		);
	}
} catch {
	// Не разобрали команду — решение за обычным permission flow.
}

interface PushCommand {
	cwd: string | null;
	args: string[];
}

/** `git push …` из составной команды: `a && git -C dir push origin x; b`. */
function findPushCommands(command: string): PushCommand[] {
	const pushes: PushCommand[] = [];

	for (const segment of command.split(/&&|\|\||[;|\n]/)) {
		const tokens = tokenize(segment);
		// git — имя команды, а не аргумент (`echo git push`): перед ним только присваивания `NAME=value`.
		const gitIndex = tokens.findIndex((token) => !/^\w+=/.test(token));
		if (gitIndex === -1 || !/(^|\/)git$/.test(tokens[gitIndex] ?? "")) continue;

		let cwd: string | null = null;
		let index = gitIndex + 1;
		while (index < tokens.length && tokens[index]?.startsWith("-")) {
			const option = tokens[index] ?? "";
			if (option === "-C") cwd = tokens[index + 1] ?? null;
			index += GIT_OPTIONS_WITH_VALUE.has(option) ? 2 : 1;
		}
		if (tokens[index] === "push") pushes.push({ cwd, args: tokens.slice(index + 1) });
	}

	return pushes;
}

function checkPush(push: PushCommand, hookCwd: string): string[] {
	const problems: string[] = [];
	const positionals: string[] = [];
	let isDelete = false;

	for (let index = 0; index < push.args.length; index += 1) {
		const arg = push.args[index] ?? "";
		if (PUSH_OPTIONS_WITH_VALUE.has(arg)) {
			index += 1;
			continue;
		}
		if (arg === "--force" || arg === "-f" || /^-[a-z]*f/.test(arg)) problems.push("`git push --force` запрещён");
		if (arg === "--all" || arg === "--mirror") problems.push(`\`git push ${arg}\` запрещён`);
		if (arg === "--delete" || arg === "-d") isDelete = true;
		if (!arg.startsWith("-")) positionals.push(arg);
	}

	const refspecs = positionals.slice(1);

	if (refspecs.length === 0) {
		const branch = currentBranch(push.cwd ?? hookCwd);
		if (branch && isProtected(branch)) problems.push(`push из защищённой ветки \`${branch}\``);
		return problems;
	}

	for (const refspec of refspecs) {
		if (refspec.startsWith("+")) problems.push(`\`${refspec}\` перезаписывает историю`);
		const destination = (refspec.includes(":") ? refspec.split(":").pop() : refspec) ?? "";
		const branch = destination.replace(/^\+/, "").replace(/^refs\/heads\//, "");
		const target = branch === "HEAD" ? currentBranch(push.cwd ?? hookCwd) : branch;
		if (target && isProtected(target)) {
			problems.push(isDelete ? `удаление защищённой ветки \`${target}\`` : `push в защищённую ветку \`${target}\``);
		}
	}

	return problems;
}

function isProtected(branch: string): boolean {
	return PROTECTED_BRANCHES.some((pattern) =>
		pattern.endsWith("*") ? branch.startsWith(pattern.slice(0, -1)) : branch === pattern,
	);
}

function currentBranch(cwd: string): string | null {
	try {
		return execFileSync("git", ["branch", "--show-current"], { cwd, encoding: "utf8" }).trim() || null;
	} catch {
		return null;
	}
}

/** Слова shell-команды с учётом кавычек; переменные и подстановки не раскрываются. */
function tokenize(segment: string): string[] {
	return [...segment.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((match) => match[1] ?? match[2] ?? match[3] ?? "");
}
