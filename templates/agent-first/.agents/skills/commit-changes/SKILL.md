---
name: commit-changes
description: Split the worktree into focused Conventional Commits. Use when a finished slice is ready to commit, or when the user asks to commit or to plan commits.
---

# Commit Changes

**Invariants:** каждый commit — один **slice** (одно логическое изменение); каждое message — Conventional Commit ([CONVENTIONAL_COMMITS.md](CONVENTIONAL_COMMITS.md)).

Вызов skill разрешает commits. Не спрашивай порядок или «коммитить ли», если пользователь явно не попросил review-only / no-commit / no-stage.

## Кто запустил

| Источник | Scope | `{{MAIN_BRANCH}}` |
| -------- | ----- | -------- |
| **user-invoked** — пользователь назвал skill или попросил закоммитить | весь dirty/staged worktree, если пользователь не сузил scope | любые slices: вызов — явный запрос |
| **agent-initiated** — агент коммитит свою готовую задачу | только изменения текущей задачи | только Markdown-документация и agent instructions |

## Branches

| Режим | Когда |
| ----- | ----- |
| default | commit intended slices |
| review-only | план slices, без staging/commit |
| no-stage | правки файлов, staging не трогать |

## Workflow

1. **Осмотри worktree** — `git status --short`, `git diff`, `git diff --staged`, `git branch --show-current`. Staged ≠ один slice.
   **Done when:** candidate files и hunks перечислены, текущая branch известна.

2. **Определи scope** по [источнику запуска](#кто-запустил). User-invoked: intended все изменения worktree. Agent-initiated: intended только изменения текущей задачи; pre-existing dirty/staged правки вне задачи не stage и не unstage.
   **Done when:** intended и оставляемые изменения разделены.

3. **Проверь branch** — только для agent-initiated: в `{{MAIN_BRANCH}}` допустимы лишь slices из Markdown-документации и agent instructions по [delivery workflow](../../../docs/engineering/delivery.md#authority). Slice с кодом, конфигом, зависимостями или тестами в `{{MAIN_BRANCH}}` не коммить: остановись и предложи ветку. User-invoked commit не ограничен branch.
   **Done when:** каждый slice допустим для текущей branch.

4. **Раздели на slices** — intended staged + unstaged как один set; тесты/docs/migrations в slice поведения; unrelated cleanup — вне.
   **Done when:** каждый intended change назначен ровно одному slice.

5. **Stage по slice** — `git add path-a path-b`; не `git add .` без явной просьбы; mixed hunks — patch или спроси.
   - Agent-initiated: если в index остаются чужие staged правки, не снимай их: коммить slice через `git commit --only -- <paths>`. Файл, где свои и чужие правки смешаны, не коммить без решения пользователя.
   **Done when:** commit затронет только текущий slice.

6. **Verify** — `git diff --cached --stat` (при `--only` — `git diff HEAD --stat -- <paths>`); релевантные checks при риске.
   - Если обязательный check падает, local commit допустим только когда failure доказанно не связан со slice, применимые targeted checks прошли, а ограничение будет указано в отчёте.
   - Если связь failure со slice не исключена, остановись до commit. Не отключай checks/hooks и не скрывай ошибку.
   **Done when:** commit не включает unrelated files; checks прошли либо выполнены условия локального commit из [delivery workflow](../../../docs/engineering/delivery.md#локальный-commit-при-failed-check).

7. **Resolve ticket** — вызови `bash ./.agents/skills/commit-changes/scripts/current-ticket.sh`.
   **Done when:** первый ticket из branch name известен или явно отсутствует; номер не придуман вручную.

8. **Commit slice** — Conventional Commit по [CONVENTIONAL_COMMITS.md](CONVENTIONAL_COMMITS.md): `type(scope): {{TICKET_KEY}}-123 русское описание`. Повтори 5–8 для следующего slice.
   **Done when:** все intended changes закоммичены; отчёт с hashes, намеренно unstaged files и оставленными чужими изменениями.
