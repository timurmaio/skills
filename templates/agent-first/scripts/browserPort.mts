/**
 * Порт dev-сервера этого checkout: `pnpm dev --port $(pnpm -s browser:port)`.
 * Основной checkout получает основной порт, каждый worktree — свой постоянный.
 */

import { APP_PORT } from "./browserRuntime.mts";

console.log(APP_PORT);
