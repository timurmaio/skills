---
name: setup-agent-workflow
description: Bootstrap or refresh the agent-first development setup in a project from the timurmaio/skills template — AGENTS.md, coding standards, engineering docs, issue tracker in docs/plans, project and vendored skills, guardrail scripts, Claude Code hooks, CI, Claude/Codex/Cursor configs. Merges into an existing AI setup. Use when the user asks to set up AI/agent-first workflow in a repo («настрой agent first», «перенеси AI сетап»), or to update a project's setup from the template.
disable-model-invocation: true
---

# Setup agent workflow

Переносит в проект шаблон [`templates/agent-first/`](https://github.com/timurmaio/skills/tree/main/templates/agent-first) и подгоняет его под проект. Шаблон — снимок сетапа, который прошёл пилот на реальных тикетах: единый цикл «реализация → `verify-change` → `review-changes` → `commit-changes`», tickets в `docs/plans/`, идеи в `docs/ideas/`, guardrails и тесты в `pnpm verify`, хуки Claude Code и CI.

Обычный случай — слияние: в проекте уже есть свой `AGENTS.md`, skills или трекер. Правила слияния — в [references/merge.md](references/merge.md).

Результат — изменения в рабочей копии и отчёт. Ветку, коммит, push — только по просьбе пользователя.

## Workflow

1. **Получи шаблон.** Склонируй репозиторий во временную папку вне проекта:

   ```bash
   git clone --depth 1 https://github.com/timurmaio/skills "$TMPDIR/agent-first-template"
   ```

   Источник — `$TMPDIR/agent-first-template/templates/agent-first/`.
   **Done when:** папка шаблона на диске, в ней есть `AGENTS.md` и `.agents/skills/`.

2. **Изучи проект.**
   - `package.json` и workspace: менеджер пакетов и его версия, scripts (`check`, `verify`, `test`, `lint`, `dev`), фреймворк, монорепо ли и какой пакет — приложение.
   - Где домены и env приложения: `src/features` или `apps/<app>/src/features`, `.env.local` или `apps/<app>/.env.local`.
   - Ветка по умолчанию (`git symbolic-ref refs/remotes/origin/HEAD`), релизные ветки, порт dev-сервера, есть ли UI и авторизация.
   - Существующий AI-сетап: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, `.claude/`, `.agents/skills/`, `skills-lock.json`, `docs/`, трекер и планы, CI. Для каждого найденного — с чем из шаблона он совпадает по смыслу.
   - Внешний трекер: ключи задач в именах веток и сообщениях коммитов (`git log --oneline -50`, `git branch -a`).
   **Done when:** известны значения [плейсхолдеров](#плейсхолдеры), кроме тех, что знает только пользователь, и список развилок слияния по [references/merge.md](references/merge.md).

3. **Спроси пользователя** одним сообщением. К каждому вопросу — твой вариант по шагу 2. Спрашивай только то, чего нет в репозитории:
   - **Полномочия:** агент коммитит сам и `review-changes` правит найденное (`autonomous`) или коммит по просьбе и ревью только читает (`on-request`). Вариант по умолчанию — `autonomous`; если проект уже записал правило, предложи его.
   - **Язык комментариев и названий тестов.** По умолчанию — русский; если код проекта уже пишет иначе, предложи его язык.
   - **Ключ задач** — только если в шаге 2 нашёлся внешний трекер или ты не уверен.
   - **Browser harness** — есть UI и dev-пользователь, которого агент может авторизовать.
   - **Защищённые ветки** сверх ветки по умолчанию: релизные и подобные.
   - **Словари доменов:** один на проект или по одному на домен.
   - **Документы, которые стеку не подходят** (нет UI, нет аналитики).
   - Развилки слияния из [references/merge.md](references/merge.md), которые нашлись в шаге 2.

   **Done when:** ответ получен.

4. **Скопируй и слей.** Файлы, которых в проекте нет, копируй как есть. Существующий файл не перезаписывай, а сливай по [references/merge.md](references/merge.md): правила проекта остаются, разделы шаблона добавляются, конфликт правил идёт в отчёт. `.gitignore` — допиши строки из [references/gitignore.txt](references/gitignore.txt), которых нет.
   **Done when:** каждый файл шаблона либо скопирован, либо слит, либо осознанно пропущен с причиной.

5. **Подставь плейсхолдеры и выбери варианты.** Блоки `<!-- variant authority=autonomous -->` и `<!-- variant authority=on-request -->` — в `AGENTS.md` и `docs/engineering/delivery.md`: оставь вариант из ответа, маркеры и второй вариант удали. Затем в корне проекта:

   ```bash
   grep -rnE '\{\{[A-Z_]+\}\}|<!-- variant' . --exclude-dir=node_modules --exclude-dir=.git
   ```

   Совпадения в файлах проекта, которые ты не трогал, — не твои (`{{…}}` в чужих шаблонах, `${{ … }}` в GitHub Actions); остальное исправь.
   **Done when:** в скопированных и слитых файлах совпадений нет.

6. **Подгони под стек.**
   - **Команды.** Таблица «Команды» в `docs/engineering/verification.md` — по scripts проекта; skills ссылаются на неё. Если в проекте уже есть канонический список команд, таблица ссылается на него ([references/merge.md](references/merge.md)). Если менеджер не pnpm, замени `pnpm` во всех документах и skills.
   - **Scripts и зависимости** — по [references/package-scripts.md](references/package-scripts.md): что входит в `check` и `verify`, монорепо, pnpm 11.
   - **Стек.** Таблица в `docs/engineering/styleguide.md` — по `package.json`; строки без решения удали.
   - **Лишние документы.** Документ, который стеку не подходит (нет UI — `forms`, `tables`, `e2e`, `accessibility`, `react`, `styling`; нет аналитики — `analytics`), удали вместе со строкой в `CODING_STANDARDS.md` и ссылками на него.
   - **Browser harness.** Без него удали `scripts/agentBrowser.mts`, `scripts/browser*.mts`, `scripts/prepareBrowserAuth.mts`, `agent-browser.json`, `docs/engineering/browser-testing.md`, `.agents/skills/verify-change/features/` и `maintain-verification-skill`, а в `verify-change` и `verification.md` оставь проверку сценария вручную пользователем. С ним — заполни `LOGIN_URL`, `LOGIN_FORM` и `prepareAppAfterLogin` в `scripts/browserRuntime.mts`; dev-сервер должен принимать `--port`.
   - **Словари.** Один словарь — `GLOSSARY-MAP.md` с одной записью на него, раскладку в `docs/agents/domain.md` поправь под один файл.
   - **CI.** Оставь шаблон своего хостинга — `.github/workflows/verify.yml` или `.gitlab-ci.yml` — и удали другой. В существующем pipeline шаги lint, typecheck и тестов замени одним `pnpm verify`, сборки оставь. Обоим шаблонам нужно поле `packageManager` в `package.json`.
   - **Хуки Claude Code** в `.claude/settings.json` вызывают `scripts/hooks/*.mts` через `node`: нужен Node 22.18+ (TypeScript без сборки). В `PROTECTED_BRANCHES` (`scripts/hooks/guardGitPush.mts`) допиши защищённые ветки из ответа.
   - **Next.js 16+.** `next dev` создаёт `AGENTS.md` и `CLAUDE.md` в пакете приложения (`agentRules`). Закоммить их как есть или выключи `agentRules` в конфиге Next — иначе в каждом worktree появятся неотслеживаемые файлы. Свои правила для пакета пиши вне маркеров блока Next.
   - **Vendored skills.** Удалённый skill убери и из `skills-lock.json`. Skills и вендорный код, поставленные мимо CLI `skills`, впиши в `SIZE_IGNORED_PREFIXES` в `scripts/projectConfig.mts`.
   **Done when:** в документах нет команд, путей и библиотек, которых нет в проекте.

7. **Проверь.** Установка зависимостей, затем по порядку:

   ```bash
   bash scripts/linkClaudeSkills.sh
   pnpm lint:skills:update     # снимок хешей vendored skills после слияния
   pnpm lint:docs --fix        # оглавления длинных документов проекта
   pnpm lint:size:seed         # только при первой установке: файлы проекта, которые уже больше лимита
   pnpm lint:agents
   pnpm exec tsc --noEmit -p scripts
   ```

   Битую ссылку чини, а не удаляй проверку. Новый файл шаблона больше 5 000 токенов — раздели, а не вноси в baseline.
   **Done when:** `pnpm lint:agents` и `tsc --noEmit -p scripts` зелёные.

## Плейсхолдеры

| Плейсхолдер                  | Что это                                            | Откуда                                               |
| ---------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| `{{PROJECT}}`                | slug проекта, kebab-case                           | имя репозитория                                      |
| `{{MAIN_BRANCH}}`            | ветка по умолчанию                                 | `git symbolic-ref refs/remotes/origin/HEAD`          |
| `{{TICKET_KEY}}`             | ключ задач внешнего трекера (`PROJ` в `PROJ-123`)  | ветки и коммиты, иначе пользователь; трекера нет — `TASK` |
| `{{DEV_PORT}}`               | порт dev-сервера основного checkout                | script `dev`, конфиг фреймворка                      |
| `{{FEATURES_DIR}}`           | папка доменов от корня репозитория                 | `src/features`, в монорепо `apps/<app>/src/features` |
| `{{APP_ENV_FILE}}`           | env приложения от корня репозитория                | `.env.local`, в монорепо `apps/<app>/.env.local`     |
| `{{CODE_COMMENTS_LANGUAGE}}` | язык комментариев и тестов, с предлогом            | ответ пользователя: `на русском`, `на английском`    |

## Отчёт

- что скопировано, что слито и с какими конфликтами, что удалено и почему;
- выбранный вариант полномочий и значения плейсхолдеров;
- результат проверок;
- что осталось человеку: заполнить `GLOSSARY-MAP.md` и словари доменов (`domain-modeling`), карту фич `verify-change` (первые проходы в браузере), dev-пользователя в `.env.browser.local`, protected branches на хостинге (хук — не граница безопасности), запуск CI;
- последней строкой — вопрос, создать ли ветку и закоммитить.
