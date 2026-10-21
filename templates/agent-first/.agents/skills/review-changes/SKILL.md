---
name: review-changes
description: Review a diff against project standards and the request's acceptance criteria, then fix confirmed findings in your own diff and return a short summary; read-only on request or for someone else's branch/MR. Use when the user asks to review changes («проверь изменения», «актуализируй ревью»), a branch, or a path.
---

# Review Changes

## Режим

- **fix** — по умолчанию для своего diff: найди findings, исправь подтверждённые, повтори `verify-change` и верни короткую сводку.
- **read-only** — пользователь просит только посмотреть («только ревью», «без правок») или diff чужой: ветка коллеги, чужой MR. Результат — полный отчёт, код не меняется.

## Scope

- Default: union `git diff` + `git diff --staged` + untracked files. Смешанный worktree с несколькими темами ревьюй целиком: делить его на коммиты — работа `commit-changes`. Сужай scope, только если пользователь назвал задачу, путь или файлы.
- `branch`: `git diff {{MAIN_BRANCH}}...HEAD` (или указанная база).
- path/module: только scope + связанные consumers.
- static review в `{{MAIN_BRANCH}}` без diff — явно пометь «не regression review».
- re-review («актуализируй ревью»): возьми прошлый отчёт из разговора и сверь каждый finding со свежим diff. Исправленные убери, оставшиеся оставь. Заново разбирай только hunks, изменившиеся после прошлого отчёта, и прямых потребителей изменённых экспортов; неизменённые места повторно не ревьюй.

Deleted files проверяй для API/i18n/imports, но не передавай в линтеры.

## Workflow

1. **Карта изменений** — сгруппируй файлы по назначению и темам; rename сравнивай по поведению.
   **Done when:** scope и file groups зафиксированы.

2. **Verification evidence** — найди `verify-change report` для того же scope.
   - Считай report свежим только в текущем контексте, если после него scoped diff не менялся и verdict — `READY`.
   - Со свежим report не повторяй generic oxlint/eslint/tsc/UI lint/typecheck: используй его evidence.
   - Без report, при `NOT READY`, несовпадающем scope или изменениях после report выполни объективные проверки ниже.
   - React/JSX в diff всегда допускает специализированный `npx react-doctor@latest --verbose --scope changed`: `pnpm check` его не заменяет. Сверяй замечания с diff и правилами проекта, не копируй их в findings автоматически.

   Изменён экспорт, у которого есть потребители, — прогони тесты всех потребителей (найди их `git grep` по имени символа), а не только по изменённым файлам. Охват — в строке Checks отчёта.

   Fallback checks только для существующих файлов, команды — в [verification.md](../../../docs/engineering/verification.md#команды):
   - lint по файлам — JS/JSX/TS/TSX/MJS/CJS/MTS/CTS;
   - typecheck — если >5 TS-файлов, публичные типы, cross-package или tsconfig;
   - workspace package (`packages/*`) — lint/typecheck по его `package.json`.

   До шага Fix не запускай tests, Storybook, browser checks и formatters — кроме проверки факта безопасности на шаге 7 и мутации пустого теста на шаге 4. Ненулевой exit fallback check → 🔴.
   **Done when:** свежий evidence переиспользован либо применимые fallback checks выполнены.

3. **Контекст правил** — открой документы, условия которых в [CODING_STANDARDS.md](../../../CODING_STANDARDS.md) совпадают со scope diff. Специализированные skills используй только для их области.
   **Done when:** прочитан документ каждого совпавшего условия.

4. **Две оси review**:
   - **Standards / maintainability** — правила репозитория, архитектура, a11y/i18n, React risks и [MAINTAINABILITY.md](MAINTAINABILITY.md). Каждый новый или изменённый тест — по [ценности теста](../../../docs/engineering/testing.md#ценность-теста); подозрение на [пустой тест](../../../docs/engineering/testing.md#пустой-тест) подтверди мутацией.
   - **Spec / acceptance criteria** — сопоставь originating request, ticket/spec и каждый AC с diff и evidence. Флагуй пропущенное поведение, лишний scope и неподтверждённые заявления. Если formal spec отсутствует, используй согласованный done condition.

   Не выдумывай отсутствующие требования. Diff тикета из `docs/plans/` без AC — 🔴. У diff без единого запроса (смешанный worktree, ревью по просьбе без задачи) ось Spec не применяется: напиши это в отчёте и проверь только Standards.
   **Done when:** обе оси имеют явный результат.

5. **Table selection regression scan** — если diff затрагивает таблицу, selection, агрегацию данных из нескольких запросов или drawer/modal вокруг таблицы, сверь его с [tables.md](../../../docs/engineering/tables.md#review-стабильность-selection).
   **Done when:** table-selection risks явно подтверждены или отклонены; без таблиц в diff — «не применимо».

6. **Состояния действий и validation lifecycle** — для форм, переходов и кнопок с async-операциями проверь [правила ожидания](../../../docs/engineering/forms.md#блокировка-действий-на-время-проверок) и [выбор состояния/доступность](../../../docs/engineering/accessibility.md#асинхронная-проверка-и-disabled-действия). Сопоставь реализацию со свежим verification evidence, tests и browser checks на этом шаге не запускай.
   **Done when:** правила проверены; нарушения оформлены как findings на changed lines.

7. **Факт безопасности** — если diff трогает код с потребителями за пределами задачи (общая форма нескольких версий или режимов, дизайн-система, общие хуки и helpers, контракт API), найди один факт, на котором держится безопасность изменения для соседей. Например: «новый prop необязательный, и все текущие вызовы его не передают». Докажи его запуском, а не рассуждением: тест, короткий скрипт с реальным кодом или сценарий в браузере. Чистую функцию проверяй временным тестом рядом с кодом (одиночный прогон — по [командам](../../../docs/engineering/verification.md#команды)) и удали его до отчёта: алиасы путей обычно работают только внутри test runner. Не удалось — запиши «не доказан» и самую дешёвую проверку, которая это закроет.
   **Done when:** факт назван и доказан запуском или помечен «не доказан» с проверкой; для diff без внешних потребителей — «не нужен».

8. **Findings** — привязывай каждый finding к changed lines и источнику требования. Structural findings ставь раньше локальных замечаний. Finding, которому не нашлось правила-источника, — кандидат в правило: предложи формулировку и место — документ правила или проверку через `correct`.
   **Done when:** у каждого finding есть место в diff, почему это важно и короткий реализуемый fix; кандидаты в правила перечислены.

9. **Fix** — только в режиме fix. Исправь 🔴 и 🟠, а ⚪ — когда решение однозначно и не расширяет scope. Finding, который требует продуктового или архитектурного решения, оставь пользователю. После правок запусти `verify-change` для того же scope и перепроверь затронутые findings.
   **Done when:** исправленные findings подтверждены свежим `verify-change`, оставшиеся перечислены с причиной.

## Severity

- 🔴 **Надо исправить** — failed check, тикет без AC, broken contract, production leakage, обязательное a11y/i18n/architecture, пропущенное требование, тест, который проходит на неверном коде (тавтологический или закрепляющий баг).
- 🟠 **Стоит исправить** — вероятная регрессия, существенное отклонение от spec, structural regression, 1000+ line growth, wrong-layer logic, недоказанный факт безопасности в общем коде, асинхронное действие без состояния ожидания и защиты от повторного нажатия.
- ⚪ **Мелочь** — локальная сложность, thin abstraction или неполный низкорисковый edge case. Вкусовщину не пиши.

## Output

Первая строка — итог простыми словами, дальше детали. Finding — заголовок из нескольких слов, место, почему это важно и как исправить.

### Режим fix

```markdown
## review-changes

**Итог:** готово | осталось решить N — <что именно>
Scope: <dirty | branch | path> · Spec/AC: N/N | done condition | не применяется · Факт безопасности: <факт> — доказан <чем> | не доказан | не нужен · verify-change: READY | NOT READY

**Исправлено (N)**
- **<что было>** — `path:LINE`: что сделано.

**Осталось (N)**
- 🟠 **<заголовок>** — `path:LINE`: почему важно; почему не исправлено (нужно решение: …).

**Кандидаты в правила:** <формулировка → куда записать> | —
```

Без findings: `**Итог:** готово, замечаний нет.`

### Режим read-only

```markdown
## review-changes

**Итог:** можно мержить | после правок | нельзя — <главная причина>
Scope: <dirty | branch | path>, N файлов · Verification: READY reused | missing | stale | NOT READY · Checks: reused | oxlint ✅ eslint ✅ tsc ⏭ ui ⏭ react-doctor ⏭ · Spec/AC: N/N | done condition | missing | не применяется · Факт безопасности: <факт> — доказан <чем> | не доказан | не нужен

### 🔴 Надо исправить (N)
1. **<заголовок>** — `path:LINE`
   Почему важно. Правило: <источник>, ось Standards | Spec.
   Fix: <как исправить>.

### 🟠 Стоит исправить (N)

### ⚪ Мелочи (N)

### Что хорошо
- до трёх пунктов, конкретно и с местом в коде.

### Кандидаты в правила
- <формулировка → документ правила или проверка через `correct`>

### Check output
<только при падении fallback check>
```

Пустую секцию не выводи. Внутри секции: structural, затем поведенческие.
