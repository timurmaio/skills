# Changelog

## Unreleased

- `setup-agent-workflow`: режим слияния с существующим AI-сетапом (`references/merge.md`), вопросы о полномочиях агента, языке комментариев, словарях и защищённых ветках, шаги для монорепо, Next.js 16, pnpm 11 и первой установки. По фидбеку прогона на papers.
- Шаблон agent-first: полномочия агента — два варианта (коммитит сам или по просьбе); плейсхолдеры `{{FEATURES_DIR}}`, `{{APP_ENV_FILE}}`, `{{CODE_COMMENTS_LANGUAGE}}` и пути в `scripts/projectConfig.mts` для монорепо.
- Шаблон agent-first: `workflow.md` разделён на `flow.md` и `setup.md`, styleguide — на части `code`, `react`, `styling`; baseline размеров пустой.
- Шаблон agent-first: проверка vendored skills сверяет снимок хешей установленных папок (`computedHash` CLI не совпадает с установленной копией), `lint:size:seed` для первой установки, исключения проверки размера, скрипт ключа задачи в `scripts/currentTicket.sh`, Doctor узнаёт dev-сервер, запущенный из пакета монорепо.
- Скилл переименован в `setup-agent-workflow`: он ставит весь рабочий процесс агента, а не только скиллы.
- Шаблон agent-first: хуки Claude Code — Stop не даёт закончить сессию с правками кода без свежего `pnpm verify`, PreToolUse запрещает push в защищённые ветки и перезапись истории.
- Шаблон agent-first: CI для GitHub Actions и GitLab с `pnpm verify`.
- Шаблон `templates/agent-first/`: AI-сетап для agent-first разработки — `AGENTS.md`, стандарты кода, инженерные документы, workflow агента, issue tracker в `docs/plans/`, project и vendored skills, guardrail-скрипты, browser harness, конфиги Claude Code, Codex и Cursor.
- Скилл `setup-agent-workflow`: переносит шаблон в проект и подгоняет под стек.

## v0.1.0

Первая версия репозитория.

- Скилл `feature-modules`: фича как deep module, фасад `index.ts` без `export *`, границы импортов, alias и ESLint.
- Скилл `ui-conventions`: не ставить `cursor: pointer` на кнопки.
- `docs/recommended-skills.md` и `scripts/install-third-party.sh`: сторонние скиллы, которые ставятся в каждый проект.
