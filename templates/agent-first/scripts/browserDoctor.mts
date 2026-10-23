/**
 * Read-only проверка перед browser verification: стоит ли гонять текущий экземпляр.
 *
 * - env-файлы скопированы в worktree;
 * - на `localhost:<APP_PORT>` слушает dev-сервер именно этого worktree, а не чужой;
 * - сервер отвечает;
 * - browser session этого worktree авторизована;
 * - подготовка после входа выполнена (`isAppReady` в browserRuntime.mts).
 *
 * Ничего не запускает и не останавливает. Exit code 1, если хоть одна проверка не прошла.
 */

import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import {
	APP_PORT,
	APP_URL,
	getBrowserSession,
	isAppReady,
	isLoginPath,
	LOGIN_URL,
	readAgentBrowser,
} from "./browserRuntime.mts";
import { APP_ENV_FILE, BROWSER_ENV_FILE } from "./projectConfig.mts";

const PORT = APP_PORT;

interface CheckResult {
	ok: boolean;
	message: string;
}

const authResult = checkBrowserAuth();

const results: [string, CheckResult][] = [
	["env", checkEnvFiles()],
	["port", checkPortOwner()],
	["server", await checkServer()],
	["auth", authResult],
	["app", authResult.ok ? checkAppReady() : { ok: false, message: "нет авторизованной session" }],
];

for (const [name, result] of results) {
	console.log(`${result.ok ? "OK  " : "FAIL"} ${name}: ${result.message}`);
}

if (results.some(([, result]) => !result.ok)) {
	process.exit(1);
}

function checkEnvFiles(): CheckResult {
	const missing = [APP_ENV_FILE, BROWSER_ENV_FILE].filter((file) => !existsSync(resolve(file)));

	return missing.length === 0
		? { ok: true, message: `${APP_ENV_FILE} и ${BROWSER_ENV_FILE} на месте` }
		: { ok: false, message: `нет ${missing.join(", ")} — выполни pnpm env:copy` };
}

function checkPortOwner(): CheckResult {
	const pids = runLsof(["-nP", `-iTCP:${PORT}`, "-sTCP:LISTEN", "-t"])
		.split("\n")
		.filter(Boolean);

	if (pids.length === 0) {
		return { ok: false, message: `порт ${PORT} свободен — запусти pnpm dev --port ${PORT}` };
	}

	const worktree = realpathSync(process.cwd());
	const foreignPids = pids.filter((pid) => getCheckoutRoot(getProcessCwd(pid)) !== worktree);

	return foreignPids.length === 0
		? { ok: true, message: `порт ${PORT} занят dev-сервером этого worktree` }
		: {
				ok: false,
				message: `порт ${PORT} занят процессом из другого каталога (pid ${foreignPids.join(", ")}) — BLOCKED, чужой процесс не трогать`,
			};
}

async function checkServer(): Promise<CheckResult> {
	try {
		const response = await fetch(LOGIN_URL, { signal: AbortSignal.timeout(30_000) });
		return response.ok
			? { ok: true, message: `${APP_URL} отвечает ${response.status}` }
			: {
					ok: false,
					message: `${APP_URL} отвечает ${response.status} — смотри лог pnpm dev`,
				};
	} catch {
		return { ok: false, message: `${APP_URL} не отвечает` };
	}
}

function checkBrowserAuth(): CheckResult {
	// `get url` без живой сессии запустил бы новый браузер, поэтому сначала смотрим список сессий.
	let isSessionActive: boolean;

	try {
		isSessionActive = hasActiveSession();
	} catch {
		return { ok: false, message: "agent-browser не отвечает — выполни pnpm browser:install" };
	}

	if (!isSessionActive) {
		return { ok: false, message: "browser session не открыта — выполни pnpm browser:login" };
	}

	let currentUrl: string;

	try {
		currentUrl = readAgentBrowser(["get", "url"]);
	} catch {
		return { ok: false, message: "browser session не отвечает — выполни pnpm browser:login" };
	}

	const url = URL.parse(currentUrl);

	if (!url || url.origin !== APP_URL) {
		return { ok: false, message: `session открыта не на ${APP_URL} — выполни pnpm browser:login` };
	}

	return isLoginPath(url.pathname)
		? { ok: false, message: "session на странице входа — выполни pnpm browser:login" }
		: { ok: true, message: `session авторизована, текущая страница ${url.pathname}` };
}

function checkAppReady(): CheckResult {
	try {
		return isAppReady()
			? { ok: true, message: "подготовка после входа выполнена" }
			: { ok: false, message: "подготовка после входа не выполнена — выполни pnpm browser:login" };
	} catch {
		return { ok: false, message: "не удалось прочитать localStorage session — выполни pnpm browser:login" };
	}
}

function hasActiveSession(): boolean {
	const output = readAgentBrowser(["session", "list", "--json"]);
	const { data } = JSON.parse(output) as { data: { sessions: (string | { name: string })[] } };

	return data.sessions.some(
		(session) => (typeof session === "string" ? session : session.name) === getBrowserSession(),
	);
}

function getProcessCwd(pid: string): string {
	const cwd = runLsof(["-a", "-p", pid, "-d", "cwd", "-Fn"])
		.split("\n")
		.find((line) => line.startsWith("n"))
		?.slice(1);

	return cwd ? realpathSync(cwd) : "";
}

// В монорепо `pnpm dev` запускает сервер из пакета (`apps/web`), поэтому сравниваем корень checkout, а не cwd.
// Префикс пути не подходит: worktree могут лежать внутри основного checkout, например в `.claude/worktrees/`.
function getCheckoutRoot(directory: string): string {
	if (!directory) return "";
	const root = spawnSync("git", ["-C", directory, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout.trim();
	return root ? realpathSync(root) : directory;
}

function runLsof(args: string[]): string {
	return spawnSync("lsof", args, { encoding: "utf8" }).stdout.trim();
}
