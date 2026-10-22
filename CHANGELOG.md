# Changelog

## Unreleased

- Шаблон `templates/agent-first/`: AI-сетап для agent-first разработки — `AGENTS.md`, стандарты кода, инженерные документы, workflow агента, issue tracker в `docs/plans/`, project и vendored skills, guardrail-скрипты, browser harness, конфиги Claude Code, Codex и Cursor.
- Скилл `agent-first-setup`: переносит шаблон в проект и подгоняет под стек.

## v0.1.0

Первая версия репозитория.

- Скилл `feature-modules`: фича как deep module, фасад `index.ts` без `export *`, границы импортов, alias и ESLint.
- Скилл `ui-conventions`: не ставить `cursor: pointer` на кнопки.
- `docs/recommended-skills.md` и `scripts/install-third-party.sh`: сторонние скиллы, которые ставятся в каждый проект.
