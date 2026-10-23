/**
 * Пути проекта, от которых зависят guardrail-скрипты и browser harness. Одно место вместо констант в каждом скрипте:
 * в монорепо домены и env лежат в пакете приложения (`apps/web/...`), а не в корне.
 */

/** Папка доменов: `src/features` или `apps/<app>/src/features`. */
export const FEATURES_DIR = "{{FEATURES_DIR}}";

/** Env приложения, который агент не читает и который копируется в worktree. */
export const APP_ENV_FILE = "{{APP_ENV_FILE}}";

/** Credentials dev-пользователя для browser harness. */
export const BROWSER_ENV_FILE = ".env.browser.local";

/**
 * Пути, которые проверка размера не смотрит, сверх vendored skills из `skills-lock.json`: skills и вендорный код,
 * поставленные мимо CLI `skills`, сгенерированные папки. Префикс пути от корня репозитория.
 */
export const SIZE_IGNORED_PREFIXES: string[] = [];
