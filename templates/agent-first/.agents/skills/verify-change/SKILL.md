---
name: verify-change
description: Collect fresh evidence that a diff works before calling it done. Use after implementation or fixes, or when the user asks whether changes are ready or tested.
---

# Verify Change

Собери evidence по [verification matrix](../../../docs/engineering/verification.md). Не подменяй verification статическим review.

## Scope

- По умолчанию: union `git diff` + `git diff --staged` + intended untracked files.
- Для branch, commit или path используй scope пользователя.
- Отделяй intended changes от чужого dirty worktree; не изменяй и не очищай чужие файлы.
- Skill read-only: не исправляй код, тесты и конфигурацию; не запускай formatters с записью и generators.
- Временная подмена данных, флага или аккаунта для визуальной проверки — только с разрешения пользователя. Перечисли её в отчёте и откати до вердикта.

## Workflow

1. Прочитай ticket/spec и acceptance criteria. Если AC отсутствуют, верни `NOT READY`.
2. Построй карту изменённых областей и классифицируй diff по `docs/engineering/verification.md`.
3. Выбери минимальные targeted checks, которые доказывают изменённое поведение. Запиши выбор до запуска.
4. Запусти targeted checks, затем обязательный `pnpm check` (команды — в [verification.md](../../../docs/engineering/verification.md#команды)). Пока targeted tests красные, Storybook и browser не запускай: верни `NOT READY` с упавшими тестами.
5. Выполни browser verification, если matrix требует проверки пользовательского сценария. Каждый такой сценарий из AC проходи в браузере целиком, от входа до результата: тест его не заменяет. Поведение, в котором не уверен, смотри в браузере или коде, а не предполагай. Не изменяй реальные внешние или production-данные без явного разрешения.
   - По умолчанию — harness `pnpm browser:*` по [browser-testing.md](../../../docs/engineering/browser-testing.md): `pnpm dev`, `pnpm browser:login`, затем `pnpm browser:doctor`. Doctor повторяй после любого неожиданного поведения; при `FAIL` чини окружение, а не продолжай сценарий.
   - Как дойти до фичи, чем её проверить и какие у неё предусловия — в [карте фич](features/README.md): общие правила и список файлов фич. Сеть — `pnpm browser:network`. Не хватает предусловия — сценарий `blocked` с причиной, сценарий не ослабляй. Новый подводный камень допиши в файл фичи.
   - Cleanup в любом исходе: закрыть сессию, остановить свой `pnpm dev`, проверить, что порт `{{DEV_PORT}}` свободен. Screenshots остаются в `browser-artifacts/`.
6. После последнего изменения используй только свежие результаты. Старый успешный output не считается evidence.
7. Верни один отчёт по шаблону ниже. При любом обязательном failed/skipped check результат — `NOT READY`.

Не запускай `review-changes` внутри этого skill: review остаётся отдельным шагом. Статический review допустим и до `READY`, но обязан отметить отсутствующий или `NOT READY` evidence и не может объявить изменение готовым. Для финального handoff используйте обычную последовательность: `verify-change` с verdict `READY`, затем `review-changes`.

## Command selection

- Сначала запускай изменённые тестовые файлы и ближайшие существующие tests изменённого поведения.
- Для workspace package используй его scripts/filters, не предполагай root-команду.
- Full test sweep запускай только для cross-cutting changes, test infrastructure, shared contracts или когда targeted scope нельзя надёжно выделить.
- Не добавляй tests внутри этого skill. Если необходимого test seam нет, укажи это как gap и верни `NOT READY`.
- Не считай lint/typecheck доказательством пользовательского поведения.

## Output

Пиши отчёт на русском:

```markdown
## verify-change report

**Scope:** <dirty/staged/branch/path>
**Classification:** <classes>
**Acceptance criteria:** <covered N/N | missing>
**Freshness:** after latest scoped change
**Code changed:** да — <пути> | нет
**Tests:** <пути добавленных или изменённых тестов | новых нет — причина>
**Temporary overrides:** <что подменялось и откачено | —>

### Evidence

| Check | Command / scenario | Result |
| ----- | ------------------ | ------ |
| Targeted tests | `<command>` | ✅/❌/⏭ |
| Project gate | `pnpm check` | ✅/❌ |
| Browser | <environment + сценарий из AC целиком> | ✅/❌/⏭ |

### Not verified

- <ограничения или `—`>

### Verdict

**READY** | **NOT READY**
```

После `NOT READY` перечисли только конкретные gaps/failures и следующий проверяемый шаг. Не объявляй изменение готовым частично: сценарий из AC, не пройденный в браузере, — это `NOT READY`.
