import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { runAgentBrowser } from "./browserRuntime.mts";

const args = process.argv.slice(2);

if (args[0] === "--") {
	args.shift();
}

// agent-browser не создаёт каталог файла сам: ни для screenshot (аргумент с расширением картинки), ни для
// `state save <path>`.
const outputPath =
	args[0] === "screenshot"
		? args.slice(1).find((arg) => /\.(png|jpe?g|webp)$/i.test(arg))
		: args[0] === "state" && args[1] === "save"
			? args[2]
			: undefined;

if (outputPath) {
	mkdirSync(dirname(outputPath), { recursive: true });
}

runAgentBrowser(args);
