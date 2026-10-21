---
name: agent-first-setup
description: Bootstrap or refresh the agent-first development setup in a project from the timurmaio/skills template — AGENTS.md, coding standards, engineering docs, issue tracker in docs/plans, project and vendored skills, guardrail scripts, Claude/Codex/Cursor configs. Use when the user asks to set up AI/agent-first workflow in a repo («настрой agent first», «перенеси AI сетап»), or to update a project's setup from the template.
disable-model-invocation: true
---

# Agent-first setup

Переносит в проект шаблон [`templates/agent-first/`](https://github.com/timurmaio/skills/tree/main/templates/agent-first) и подгоняет его под проект. Шаблон — снимок сетапа, который прошёл пилот на реальных тикетах: единый цикл «реализация → `verify-change` → `review-changes` → `commit-changes`», tickets в `docs/plans/`, идеи в `docs/ideas/`, guardrails в `pnpm check`.

Результат — изменения в рабочей копии и отчёт. Ветку, коммит, push — только по просьбе пользователя.

## Workflow

1. **Получи шаблон.** Склонируй репозиторий во временную папку вне проекта:

   ```bash
   git clone --depth 1 https://github.com/timurmaio/skills "$TMPDIR/agent-first-template"
   ```

   Источник — `$TMPDIR/agent-first-template/templates/agent-first/`.
   **Done when:** папка шаблона на диске, в ней есть `AGENTS.md` и `.agents/skills/`.

2. **Изучи проект.** `package.json` (менеджер пакетов, scripts, фреймворк, тесты, lint), структура `src/`, существующие `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, `.claude/`, `docs/`, ветка по умолчанию (`git symbolic-ref refs/remotes/origin/HEAD`), порт dev-сервера, есть ли UI и авторизация.
   **Done when:** известны значения плейсхолдеров из таблицы ниже, кроме тех, что знает только пользователь, и список конфликтующих файлов.

3. **Спроси пользователя** одним сообщением только то, чего нет в репозитории: ключ задач трекера (`PROJ` в `PROJ-123`), нужен ли browser harness (есть UI и dev-пользователь), какие engineering-документы не подходят стеку. К каждому вопросу — твой вариант по шагу 2.
   **Done when:** ответ получен.

4. **Скопируй без перезаписи.** Файлы, которых в проекте нет, копируй как есть. Существующий файл не перезаписывай: слей содержимое — правила проекта остаются, разделы шаблона добавляются, конфликт правил назови в отчёте. `.gitignore` — допиши строки из [references/gitignore.txt](references/gitignore.txt), которых нет.
   **Done when:** каждый файл шаблона либо скопирован, либо слит, либо осознанно пропущен с причиной.

5. **Подставь плейсхолдеры** во всех скопированных файлах, затем `grep -rn '{{' AGENTS.md CODING_STANDARDS.md GLOSSARY-MAP.md docs .agents .claude .codex scripts` — пусто.

   | Плейсхолдер       | Что это                          | Откуда                                   |
   | ----------------- | -------------------------------- | ---------------------------------------- |
   | `{{PROJECT}}`     | slug проекта, kebab-case         | имя репозитория                          |
   | `{{MAIN_BRANCH}}` | ветка по умолчанию               | `git symbolic-ref refs/remotes/origin/HEAD` |
   | `{{TICKET_KEY}}`  | ключ задач трекера               | пользователь; нет трекера — `TASK`       |
   | `{{DEV_PORT}}`    | порт dev-сервера                 | script `dev`, конфиг фреймворка          |

   **Done when:** grep пуст.

6. **Подгони под стек.**
   - Команды проекта — в таблицу «Команды» `docs/engineering/verification.md`; skills ссылаются на неё. Если менеджер не pnpm, замени `pnpm` во всех документах и skills.
   - Scripts и devDependencies — по [references/package-scripts.json](references/package-scripts.json): `check` объединяет `lint:agents` с lint и typecheck проекта.
   - Таблица стека в `docs/engineering/styleguide.md` — по `package.json`; строки без решения удали.
   - Документ, который стеку не подходит (нет UI — `forms`, `tables`, `e2e`, `accessibility`, `styleguide`; нет аналитики — `analytics`), удали вместе со строкой в `CODING_STANDARDS.md` и ссылками на него.
   - Без browser harness удали `scripts/agentBrowser.mts`, `scripts/browser*.mts`, `scripts/prepareBrowserAuth.mts`, `agent-browser.json`, `docs/engineering/browser-testing.md`, `.agents/skills/verify-change/features/` и `maintain-verification-skill`, а в `verify-change` и `verification.md` оставь проверку сценария вручную пользователем. С harness — заполни `LOGIN_URL`, `LOGIN_FORM` и `prepareAppAfterLogin` в `scripts/browserRuntime.mts`.
   - Удалённый vendored skill убери и из `skills-lock.json`.
   **Done when:** в документах нет команд, путей и библиотек, которых нет в проекте.

7. **Проверь.** `bash scripts/linkClaudeSkills.sh`, установка зависимостей, `pnpm lint:size:update` (подстановка плейсхолдеров уменьшила файлы из baseline), затем `pnpm lint:agents` и `tsc --noEmit -p scripts`. Битую ссылку чини, а не удаляй проверку. Файл проекта больше 5 000 токенов раздели или, если он уже был до setup, внеси в `scripts/baselines/file-size.json`.
   **Done when:** `pnpm lint:agents` и `tsc --noEmit -p scripts` зелёные.

## Отчёт

- что скопировано, что слито и с какими конфликтами, что удалено и почему;
- значения плейсхолдеров;
- результат проверок;
- что осталось человеку: заполнить `GLOSSARY-MAP.md` и словари доменов (`domain-modeling`), карту фич `verify-change` (первые проходы в браузере), dev-пользователя в `.env.browser.local`, CI-запуск `pnpm check`;
- последней строкой — вопрос, создать ли ветку и закоммитить.
