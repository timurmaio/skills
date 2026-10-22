import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import {
	isAppReady,
	isLoginPath,
	LOGIN_FORM,
	LOGIN_URL,
	prepareAppAfterLogin,
	readAgentBrowser,
	runAgentBrowser,
} from "./browserRuntime.mts";

const LOCAL_APP_ENV_PATH = resolve(process.cwd(), ".env.local");
const LOCAL_BROWSER_ENV_PATH = resolve(process.cwd(), ".env.browser.local");
const AUTH_PROFILE = "{{PROJECT}}-dev";
const LOGIN_TIMEOUT_MS = 15_000;

if (process.argv.includes("--headed")) {
	process.env.AGENT_BROWSER_HEADED = "true";
}

if (existsSync(LOCAL_APP_ENV_PATH)) {
	loadEnvFile(LOCAL_APP_ENV_PATH);
}

if (existsSync(LOCAL_BROWSER_ENV_PATH)) {
	assertQuotedHashValue(LOCAL_BROWSER_ENV_PATH, "BROWSER_USER_PASSWORD");
	loadEnvFile(LOCAL_BROWSER_ENV_PATH);
}

const email = getRequiredBrowserEnv("BROWSER_USER_EMAIL");
const password = getRequiredBrowserEnv("BROWSER_USER_PASSWORD");

runAgentBrowser(
	[
		"auth",
		"save",
		AUTH_PROFILE,
		"--url",
		LOGIN_URL,
		"--username",
		email,
		"--password-stdin",
		"--username-selector",
		LOGIN_FORM.usernameSelector,
		"--password-selector",
		LOGIN_FORM.passwordSelector,
		"--submit-selector",
		LOGIN_FORM.submitSelector,
	],
	{ input: password, quiet: true },
);

if (!tryLogin()) {
	// Не оставлять введённые креды в открытой сессии.
	tryAgentBrowser(["fill", LOGIN_FORM.usernameSelector, ""]);
	tryAgentBrowser(["fill", LOGIN_FORM.passwordSelector, ""]);
	tryAgentBrowser(["close"]);
	throw new Error("Browser login failed: application remained on the login page");
}

// Подготовка после входа (feature flags в dev, выбор аккаунта) — в browserRuntime.mts.
if (!isAppReady()) {
	prepareAppAfterLogin();
}

// Любой сбой после submit — тоже неудачный вход: креды нельзя оставлять в сессии.
function tryLogin(): boolean {
	try {
		return login();
	} catch {
		return false;
	}
}

function login(): boolean {
	// Сессия worktree переживает перезапуск браузера: уже авторизованную страница входа уводит с /login.
	readAgentBrowser(["open", LOGIN_URL]);
	readAgentBrowser(["wait", "2000"]);
	if (!isLoginPath(new URL(readAgentBrowser(["get", "url"])).pathname)) {
		return true;
	}

	if (!tryAgentBrowser(["auth", "login", AUTH_PROFILE])) {
		return false;
	}

	// После submit приложение уходит со страницы входа не сразу.
	const deadline = Date.now() + LOGIN_TIMEOUT_MS;

	while (Date.now() < deadline) {
		if (!isLoginPath(new URL(readAgentBrowser(["get", "url"])).pathname)) {
			return true;
		}
		readAgentBrowser(["wait", "500"]);
	}

	return false;
}

function tryAgentBrowser(args: string[]): boolean {
	try {
		readAgentBrowser(args);
		return true;
	} catch {
		return false;
	}
}

function getRequiredBrowserEnv(name: "BROWSER_USER_EMAIL" | "BROWSER_USER_PASSWORD"): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required for authenticated browser verification`);
	}

	return value;
}

function assertQuotedHashValue(path: string, name: "BROWSER_USER_PASSWORD"): void {
	const assignment = readFileSync(path, "utf8")
		.split(/\r?\n/)
		.find((line) => new RegExp(`^\\s*${name}\\s*=`).test(line));

	if (!assignment) {
		return;
	}

	const rawValue = assignment.slice(assignment.indexOf("=") + 1).trimStart();
	const isQuoted = rawValue.startsWith('"') || rawValue.startsWith("'");

	if (rawValue.includes("#") && !isQuoted) {
		throw new Error(`${name} contains an unquoted #; quote the complete value in .env.browser.local`);
	}
}
