# Conventional Commits (project rules)

Формат:

```text
<type>[optional scope]: [{{TICKET_KEY}}-123] <русское description>

[optional body]

[optional footer(s)]
```

Выбирай `type` по пользовательскому эффекту slice, а не по списку затронутых файлов:

- `feat`: новая пользовательская, продуктовая или публичная возможность.
- `fix`: исправление неправильного поведения.
- `perf`: измеримое или целевое улучшение производительности.
- `refactor`: изменение структуры без изменения поведения.
- `test`: тесты без изменения продуктовой логики.
- `docs`: документация и agent instructions без runtime-изменений.
- `build`: зависимости, сборка, package manager, generated API/types.
- `ci`: pipeline, checks, release automation.
- `chore`: обслуживание, которое не подходит под типы выше. Не используй как catch-all.
- `revert`: откат предыдущего commit.

Scope ставь, когда он делает историю понятнее: домен из `src/features`, package name, tool или workflow (`feat(projects): ...`, `fix(ui): ...`, `ci(release): ...`, `docs(agents): ...`). Не придумывай scope, если весь смысл уже ясен из description.

Description пиши на русском, без точки в конце. Ticket получай через `bash ./.agents/skills/commit-changes/scripts/current-ticket.sh`; скрипт возвращает первый ключ задачи (`{{TICKET_KEY}}-123`) из branch name. Если скрипт вернул номер, ставь его первым в description после `type(scope):`: `fix(reports): {{TICKET_KEY}}-123 сохранить фильтры при смене вкладки`. Если ticket не найден, не выдумывай номер. Не ставь номер задачи перед `type`, чтобы не ломать Conventional Commit. Формулируй как release note для пользователя изменения, а не как внутренний log: `fix(reports): {{TICKET_KEY}}-123 сохранить фильтры при смене вкладки`, не `fix(reports): {{TICKET_KEY}}-123 обновить useEffect`.

Body добавляй, когда future agent выиграет от контекста:

- почему выбран такой подход;
- какие ограничения или trade-offs важны;
- какие проверки запускались или почему они не запускались;
- что сознательно оставлено вне commit.

Footer используй для machine-readable последствий:

- `BREAKING CHANGE: ...` при изменении публичного контракта, migration path или обязательных действий после update.
- `Refs: {{TICKET_KEY}}-123` / `Closes: {{TICKET_KEY}}-123`, если ticket известен из контекста и нужен машинно-читаемый footer помимо subject.

Если change breaking, пометь это в header через `!` и добавь footer:

```text
feat(api)!: {{TICKET_KEY}}-123 требовать явный account id для запросов статистики

BREAKING CHANGE: callers must pass accountId instead of relying on the active account.
```
