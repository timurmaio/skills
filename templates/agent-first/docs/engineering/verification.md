# Verification

[Карта инженерной документации](../../CODING_STANDARDS.md).

Обязательный evidence gate перед финальным handoff и заявлением о готовности. Цель — доказать, что изменённое поведение работает, а не только что код компилируется. Статический review можно выполнять раньше: он помогает найти дефекты, но не заменяет verification.

## Содержание

- [Базовый контракт](#базовый-контракт)
- [Команды](#команды)
- [Verification matrix](#verification-matrix)
- [Выбор tests](#выбор-tests)
- [Browser verification](#browser-verification)
- [Локальные процессы](#локальные-процессы)
- [Design conformance](#design-conformance)
- [Evidence report](#evidence-report)

## Базовый контракт

Для каждого ticket:

1. Зафиксировать acceptance criteria и изменённые области.
2. Выбрать и запустить targeted checks.
3. Выполнить `pnpm verify`: статические проверки и все тесты.
4. Проверить пользовательский сценарий в browser, если изменение его затрагивает.
5. Вернуть свежий evidence report с ограничениями проверки.

Проверка считается свежей, только если она выполнена после последнего изменения затронутого кода. Failed или пропущенный обязательный check означает `NOT READY`.

## Команды

Единый список команд проекта: skills и документы ссылаются сюда, а не повторяют команды у себя.

| Что | Команда |
| --- | --- |
| Project gate: статические проверки и все тесты; его же запускает CI, успех отмечает дерево файлов для Stop-хука | `pnpm verify` |
| Статические проверки: lint, типы, guardrails документации и skills | `pnpm check` |
| Один тестовый файл | `pnpm exec vitest run <path>` |
| Все тесты | `pnpm test:run` |
| Lint по файлам | `pnpm exec oxlint <files>`, `pnpm exec eslint --cache <files>` |
| Типы | `pnpm exec tsc --noEmit` |
| Production build | `pnpm build` |
| Dev-сервер | `pnpm dev --port $(pnpm -s browser:port)`: основной checkout — `{{DEV_PORT}}`, worktree — свой порт |
| Browser harness | `pnpm browser:login`, `pnpm browser:doctor`, `pnpm browser -- <command>` |

## Verification matrix

| Класс изменения                                               | Targeted checks                                                          | Дополнительная проверка                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Docs only                                                     | `git diff --check`; проверить ссылки и команды по доступным источникам   | Browser не нужен                                                                     |
| Pure helper, mapper, validator, state transition              | Ближайшие unit tests, включая boundary cases                             | Добавить test во время implementation, если изменено нетривиальное поведение         |
| React hook или component logic                                | Ближайшие behavior tests на самом высоком устойчивом seam                | Browser для изменённого пользовательского сценария                                   |
| UI layout, interaction, form, navigation, loading/error state | Существующие tests применимой логики                                     | Browser обязателен; при нормативном design source — явное сравнение, не только smoke |
| API contract, request/response mapping, cache lifecycle       | Mapper/validator/query tests и typecheck через общий gate                | Проверить loading, success и failure states на доступном безопасном seam             |
| Workspace package (`packages/*`)                              | Targeted tests пакета через `pnpm --filter <package> test -- <scope>`    | Build/Storybook/browser по затронутому публичному контракту                          |
| Build, dependency, tooling или framework config               | Минимальная команда затронутого tool + `pnpm verify`                     | `pnpm build`, если изменение влияет на production build/runtime                      |
| Cross-cutting shared contract или test infrastructure         | Все затронутые suites, затем `pnpm verify`                               | Build/browser по потребителям высокого риска                                         |

`pnpm verify` обязателен для каждого ticket и запускается после targeted checks: targeted tests доказывают изменённое поведение и быстро показывают, что сломано, а полный прогон ловит регрессии у потребителей. CI запускает тот же `pnpm verify`: зелёный локальный прогон не заменяет pipeline, а pipeline не заменяет browser verification.

## Выбор tests

Приоритет:

1. Изменённые test-файлы.
2. Ближайшие существующие tests изменённого поведения.
3. Tests публичного или доменного контракта, который потребляет изменение.
4. Full suite, если изменение cross-cutting или targeted scope нельзя доказать.

Следуйте [testing.md](testing.md). Не добавляйте regression tests для простого UI wiring, если сценарий быстрее и надёжнее проверяется через browser. Изменённая pure-функция с нетривиальным поведением требует test на уровне функции.

## Browser verification

Browser обязателен, когда diff меняет наблюдаемый пользовательский сценарий: interaction, form, navigation, permissions, responsive layout, loading/error/empty state или визуальную композицию.

По умолчанию — harness `pnpm browser:*`: запуск, авторизация, Doctor, cleanup и env-контракт описаны в [browser-testing.md](browser-testing.md). In-app Browser или Chrome — когда пользователь просит или нужна его авторизованная среда.

- Проверяйте acceptance criteria, а не произвольный smoke test страницы.
- Для create/update/delete используйте test environment и безопасные данные с понятной очисткой.
- Не изменяйте production и внешние реальные данные без явного разрешения.
- Зафиксируйте environment/URL, сценарий, ожидаемый и наблюдаемый результат.
- Если обязательный сценарий нельзя проверить, укажите причину и верните `NOT READY`; пользователь может отдельно принять это ограничение.

## Локальные процессы

Любой долгоживущий процесс, запущенный для проверки (`dev`-сервер, Storybook, watch-режим и аналогичный), останавливайте до завершения задачи. После остановки убедитесь, что процесс действительно завершился и занятый им порт освобождён. Не оставляйте stale-процессы пользователю.

## Design conformance

Browser verification и design conformance — разные evidence:

- Browser smoke доказывает, что interaction/API journey работает.
- Design conformance доказывает соответствие нормативному Figma/frame/design source: composition, presence/order/visibility полей, states, тексты и материальные layout-отношения.
- Если ticket содержит `Design acceptance: in this ticket`, report указывает source/nodes, сопоставимые browser states и screenshots; необъяснённое материальное расхождение означает `NOT READY`.
- Если design acceptance разнесена на несколько functional slices, каждый slice ссылается на конкретный closing ticket. До его завершения можно утверждать только functional acceptance slice, но не готовность экрана/flow целиком.
- `Screenshot` без указанного design source и сравнения не считается conformance evidence.

## Evidence report

Разделяйте утверждения «реализовано», «review без замечаний», «tests прошли» и «сценарий проверен end-to-end». Ни одно из них не заменяет остальные. Открытый dialog или показанная клиентская ошибка не доказывают успешную mutation: для этого нужно подтвердить её результат и сохранённое состояние. Указывайте покрытие по конкретным сценариям и явно называйте пропущенные или заблокированные шаги; отсутствие замечаний review не означает отсутствие всех возможных дефектов.

```markdown
## verify-change report

**Scope:** <dirty/staged/branch/path>
**Classification:** <classes>
**Acceptance criteria:** <covered N/N | missing>
**Freshness:** after latest scoped change

### Evidence

| Check          | Command / scenario                | Result  |
| -------------- | --------------------------------- | ------- |
| Targeted tests | `<command>`                       | ✅/❌/⏭ |
| Project gate   | `pnpm verify`                     | ✅/❌   |
| Browser        | <environment + scenario>          | ✅/❌/⏭ |
| Design source  | <source/nodes or deferred ticket> | ✅/❌/⏭ |

### Not verified

- <ограничения или `—`>

### Verdict

**READY** | **NOT READY**
```

Evidence report не заменяет `review-changes`. Статический review допустим при отсутствующем, устаревшем или `NOT READY` report, но обязан явно назвать неподтверждённые части; отсутствие findings в таком review не означает готовность изменения. Обычная финальная последовательность: verification возвращает `READY`, затем выполняется review standards/maintainability и соответствия acceptance criteria. Если scoped diff после report не менялся, `review-changes` переиспользует свежие generic checks и не запускает lint/typecheck повторно.
