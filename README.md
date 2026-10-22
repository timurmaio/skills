# skills

Общие скиллы для AI-first разработки. Ставятся в проект через CLI [`skills`](https://github.com/vercel-labs/skills) — и в репозиторий на GitHub, и в репозиторий на self-hosted GitLab. CLI кладёт скилл в рабочую копию проекта; хост git на установку не влияет.

CLI ищет `skills/<имя>/SKILL.md` с фронтматтером `name` и `description`. Копируется папка скилла целиком, поэтому справочные файлы лежат внутри неё.

## Скиллы

| Скилл | О чём |
| --- | --- |
| `feature-modules` | Фича как deep module: фасад `index.ts`, без `export *`, импорт только из корня фичи, alias и ESLint. |
| `ui-conventions` | Не ставить `cursor: pointer` на кнопки. Курсор-рука — конвенция для ссылок. |
| `agent-first-setup` | Переносит в проект шаблон [agent-first](#шаблон-agent-first) и подгоняет его под стек. Запускается только командой `/agent-first-setup`. |

Сторонние скиллы, которые ставятся в каждый проект отдельно от этого репозитория: [docs/recommended-skills.md](docs/recommended-skills.md).

## Шаблон agent-first

[`templates/agent-first/`](templates/agent-first) — AI-сетап для agent-first разработки, обобщённый из рабочего проекта. Папка повторяет корень проекта: её содержимое копируется поверх репозитория, после чего плейсхолдеры `{{PROJECT}}`, `{{MAIN_BRANCH}}`, `{{TICKET_KEY}}`, `{{DEV_PORT}}` заменяются значениями проекта. Перенос и подгонку делает скилл `agent-first-setup`.

Что внутри:

| Часть | Файлы |
| --- | --- |
| Точка входа агента | `AGENTS.md` (guardrails и pointers), `CLAUDE.md` → `@AGENTS.md`, `CODING_STANDARDS.md` (правила и карта документов по условию), `GLOSSARY-MAP.md` |
| Workflow агента | `docs/agents/`: единый цикл и выбор skill, адаптации upstream skills, repository Markdown как issue tracker (`docs/plans/`, статусы, контракт ticket), доменные словари и ADR, очередь повторов для `/correct` |
| Инженерные документы | `docs/engineering/`: delivery (границы коммитов и внешних действий), verification (evidence gate, команды), testing, browser-testing, features, styleguide, forms, accessibility, tables, e2e, analytics |
| Идеи и планы | `docs/ideas/README.md` (формат заметок), `docs/plans/completed/` |
| Project skills | `capture-idea`, `catch-up`, `commit-changes`, `review-changes`, `summarize-changes`, `verify-change` с картой фич |
| Vendored skills | 15 skills из `mattpocock/skills`, `obra/superpowers`, `cursor/plugins` в `.agents/skills/`, хеши в `skills-lock.json`: `grilling`, `to-spec`, `to-tickets`, `implement`, `implement-spec`, `wayfinder`, `research`, `prototype`, `domain-modeling`, `writing-for-agents`, `test-driven-development`, `systematic-debugging`, `receiving-code-review`, `correct`, `maintain-verification-skill` |
| Guardrails | `scripts/`: vendored skills не патчены, симлинки `.claude/skills`, битые ссылки, оглавление длинных документов, лимит 5 000 токенов на файл, копия env в worktree |
| Browser harness | `scripts/agentBrowser.mts`, `browser*.mts`, `prepareBrowserAuth.mts`, `agent-browser.json`: агент сам логинится и проверяет сценарий в изолированном браузере |
| Конфиги агентов | `.claude/settings.json` (env не читать, `git push` с подтверждением), `.claude/launch.json`, `.codex/rules/project.rules`, `.cursorignore` |

Vendored skills в шаблоне — копии upstream один в один: обновляются через `npx skills add <source> --skill <name>`, адаптации живут в `docs/agents/upstream-skills.md`.

## Установка

Следить за веткой по умолчанию:

```bash
npx skills add timurmaio/skills
```

Закрепить версию. Фрагмент `#v0.1.0` — git-тег, его разбирает CLI (`owner/repo#ref`, ref уходит в `git clone --branch`, поэтому подходят и ветка, и тег):

```bash
npx skills add timurmaio/skills#v0.1.0
```

Тег `v0.1.0` публикуется отдельно. Пока тега нет, ставь без фрагмента.

Список скиллов без установки:

```bash
npx skills add timurmaio/skills --list
```

## Обновление

```bash
npx skills update
```

`skills update` ставит заново тот ref, который записан при установке. Для `timurmaio/skills#v0.1.0` это снова тег `v0.1.0`: тег не двигается, и update не переходит на следующую версию. Чтобы сменить версию, добавь скиллы ещё раз с новым тегом:

```bash
npx skills add timurmaio/skills#v0.2.0
```

Без фрагмента установка идёт с ветки по умолчанию, и `npx skills update` подтягивает новые коммиты этой ветки.

## Телеметрия

CLI `skills` отправляет анонимную телеметрию на `skills.sh`. Отключение:

```bash
DISABLE_TELEMETRY=1 npx skills add timurmaio/skills
```

То же делает `DO_NOT_TRACK=1`. Любое непустое значение `DISABLE_TELEMETRY` выключает телеметрию.
