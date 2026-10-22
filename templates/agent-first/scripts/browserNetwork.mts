/**
 * Сетевые запросы browser-сессии в виде, безопасном для evidence: метод, host+path без query, статус.
 *
 * Headers, cookies, query и body не выводятся. Повторы схлопываются.
 *
 * `pnpm browser:network` — запросы к API, без localhost и служебных хостов из `IGNORED_HOSTS`.
 * `pnpm browser:network -- --mutations` — только POST, PUT, PATCH и DELETE.
 * `pnpm browser:network -- --clear` — очистить журнал перед сценарием.
 */

import { readAgentBrowser, runAgentBrowser } from "./browserRuntime.mts";

// Хосты телеметрии и ошибок, которые не доказывают сценарий.
const IGNORED_HOSTS = ["localhost", "sentry", "amplitude", "posthog"];
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface NetworkRequest {
	method?: string;
	url?: string;
	status?: number | null;
}

const args = new Set(process.argv.slice(2));

if (args.has("--clear")) {
	runAgentBrowser(["network", "requests", "--clear"]);
	process.exit(0);
}

const output = readAgentBrowser(["network", "requests", "--json"]);
const { data } = JSON.parse(output.slice(output.indexOf("{"))) as { data?: { requests?: NetworkRequest[] } };
const lines = new Set<string>();

for (const request of data?.requests ?? []) {
	const url = URL.parse(request.url ?? "");
	const method = request.method ?? "";

	if (
		!url ||
		!url.protocol.startsWith("http") ||
		method === "OPTIONS" ||
		IGNORED_HOSTS.some((host) => url.host.includes(host))
	) {
		continue;
	}
	if (args.has("--mutations") && !MUTATION_METHODS.has(method)) {
		continue;
	}
	lines.add(`${method} ${url.host}${url.pathname} ${request.status ?? "pending"}`);
}

console.log(lines.size > 0 ? [...lines].join("\n") : "запросов нет");
