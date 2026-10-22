/**
 * Состояние агентских хуков одного checkout: дерево файлов в начале сессии и после последнего `pnpm verify`.
 *
 * Лежит в git-каталоге checkout (`.git/agent/` или `.git/worktrees/<name>/agent/`): не попадает в diff,
 * у каждого worktree своё. Дерево — хеш содержимого рабочей копии с неотслеживаемыми файлами без игнорируемых,
 * поэтому коммит не меняет его, а любая правка файла — меняет.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface SessionState {
	startTree: string;
}

interface VerifyStamp {
	tree: string;
	verifiedAt: string;
}

export function getWorkingTree(cwd: string): string {
	const temporaryIndex = join(getAgentDir(cwd), `index-${process.pid}`);
	const index = git(cwd, ["rev-parse", "--path-format=absolute", "--git-path", "index"]);

	if (existsSync(index)) {
		copyFileSync(index, temporaryIndex);
	}

	try {
		const environment = { ...process.env, GIT_INDEX_FILE: temporaryIndex };
		execFileSync("git", ["add", "--all"], { cwd, env: environment, stdio: "ignore" });
		return execFileSync("git", ["write-tree"], { cwd, env: environment, encoding: "utf8" }).trim();
	} finally {
		rmSync(temporaryIndex, { force: true });
	}
}

export function listChangedFiles(cwd: string, fromTree: string, toTree: string): string[] {
	return git(cwd, ["diff", "--name-only", fromTree, toTree]).split("\n").filter(Boolean);
}

export function readSessionState(cwd: string, sessionId: string): SessionState | null {
	return readJson<SessionState>(join(getAgentDir(cwd), `session-${sessionId}.json`));
}

export function writeSessionState(cwd: string, sessionId: string, state: SessionState): void {
	writeFileSync(join(getAgentDir(cwd), `session-${sessionId}.json`), JSON.stringify(state));
}

export function readVerifyStamp(cwd: string): VerifyStamp | null {
	return readJson<VerifyStamp>(join(getAgentDir(cwd), "verify.json"));
}

export function writeVerifyStamp(cwd: string, stamp: VerifyStamp): void {
	writeFileSync(join(getAgentDir(cwd), "verify.json"), JSON.stringify(stamp));
}

/** JSON события хука из stdin. */
export function readHookInput<T>(): T {
	return JSON.parse(readFileSync(0, "utf8")) as T;
}

function getAgentDir(cwd: string): string {
	const agentDir = join(git(cwd, ["rev-parse", "--absolute-git-dir"]), "agent");
	mkdirSync(agentDir, { recursive: true });
	return agentDir;
}

function readJson<T>(path: string): T | null {
	try {
		return JSON.parse(readFileSync(path, "utf8")) as T;
	} catch {
		return null;
	}
}

function git(cwd: string, args: string[]): string {
	return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}
