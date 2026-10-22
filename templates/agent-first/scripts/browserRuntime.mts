import { execFileSync, spawnSync, type SpawnSyncOptionsWithStringEncoding } from "node:child_process";
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";

const BROWSER_SECRET_NAMES = ["BROWSER_USER_EMAIL", "BROWSER_USER_PASSWORD"];

// Проектные константы harness: порт `pnpm dev` основного checkout, страница входа и поля её формы.
const MAIN_DEV_PORT = {{DEV_PORT}};
// Сколько портов после основного занимают worktree агентов.
const WORKTREE_PORT_RANGE = 100;

export const APP_PORT = getAppPort();
export const APP_URL = `http://localhost:${APP_PORT}`;
export const LOGIN_URL = `${APP_URL}/login`;
export const LOGIN_FORM = {
	usernameSelector: 'input[name="email"]',
	passwordSelector: 'input[name="password"]',
	submitSelector: 'form button[type="submit"]',
};

/** Страница входа. Приложение с локалью в пути (`/<locale>/login`) тоже попадает сюда. */
export function isLoginPath(pathname: string): boolean {
	return pathname.endsWith("/login");
}

/**
 * Готова ли авторизованная сессия к проверке сверх самого входа: включены feature flags в dev, выбран аккаунт.
 * Пока подготовки нет — всегда `true`. Doctor показывает результат как `app`.
 */
export function isAppReady(): boolean {
	return true;
}

/** Подготовка после входа, которую проверяет `isAppReady`: запись флага в localStorage, выбор аккаунта, reload. */
export function prepareAppAfterLogin(): void {}

interface RunAgentBrowserOptions {
	input?: string;
	quiet?: boolean;
}

export function runAgentBrowser(args: string[], options: RunAgentBrowserOptions = {}): void {
	const result = spawnAgentBrowser(args, options);

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

export function readAgentBrowser(args: string[]): string {
	const result = spawnAgentBrowser(args, { quiet: true });

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		throw new Error(`agent-browser command failed with exit code ${result.status ?? 1}`);
	}

	return result.stdout.trim();
}

function spawnAgentBrowser(args: string[], options: RunAgentBrowserOptions) {
	const executable = resolve(
		"node_modules",
		".bin",
		process.platform === "win32" ? "agent-browser.cmd" : "agent-browser",
	);
	const spawnOptions: SpawnSyncOptionsWithStringEncoding = {
		encoding: "utf8",
		env: getBrowserProcessEnv(),
		// Журнал сети с headers и body легко превышает 1 МБ по умолчанию.
		maxBuffer: 64 * 1024 * 1024,
		stdio: [options.input === undefined ? "ignore" : "pipe", options.quiet ? "pipe" : "inherit", "inherit"],
	};

	return spawnSync(
		executable,
		["--session", getBrowserSession(), ...args],
		options.input === undefined ? spawnOptions : { ...spawnOptions, input: options.input },
	);
}

/**
 * Порт dev-сервера этого checkout: основной checkout — основной порт, каждый worktree — свой постоянный порт из
 * диапазона после него. Так агенты в разных worktree проверяют в браузере параллельно. `APP_PORT` переопределяет.
 */
function getAppPort(): number {
	if (process.env.APP_PORT) {
		return Number(process.env.APP_PORT);
	}

	const primaryWorktree = execFileSync("git", ["worktree", "list", "--porcelain"], { encoding: "utf8" })
		.split("\n")[0]
		?.replace(/^worktree /, "");

	if (!primaryWorktree || realpathSync(primaryWorktree) === realpathSync(process.cwd())) {
		return MAIN_DEV_PORT;
	}

	const worktreeHash = Number.parseInt(createHash("sha256").update(process.cwd()).digest("hex").slice(0, 8), 16);
	return MAIN_DEV_PORT + 1 + (worktreeHash % WORKTREE_PORT_RANGE);
}

/** Своя browser session на каждый worktree: агенты в разных worktree не делят вкладки и cookies. */
export function getBrowserSession(): string {
	if (process.env.AGENT_BROWSER_SESSION) {
		return process.env.AGENT_BROWSER_SESSION;
	}

	const worktreeHash = createHash("sha256").update(process.cwd()).digest("hex").slice(0, 12);
	return `{{PROJECT}}-${worktreeHash}`;
}

function getBrowserProcessEnv(): NodeJS.ProcessEnv {
	const environment = { ...process.env };

	for (const name of BROWSER_SECRET_NAMES) {
		delete environment[name];
	}

	return environment;
}
