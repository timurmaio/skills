# Work artifacts: Repository Markdown

## Содержание

- [Граница: идея или инициатива](#граница-идея-или-инициатива)
- [Артефакты инициативы](#артефакты-инициативы)
- [Статусы](#статусы)
- [Роли](#роли)
- [Публикация из skills](#публикация-из-skills)
- [Внешний трекер](#внешний-трекер)
- [Wayfinding operations](#wayfinding-operations)

## Граница: идея или инициатива

Граница между папками — `grilling`.

- Не прошло `grilling` — заметка в [docs/ideas/](../ideas/README.md), её записывает `capture-idea`. Это относится и к продуктовым идеям, и к идее с большим контекстом разговора: контекст идёт в раздел `Context` заметки.
- Прошло `grilling` — инициатива в `docs/plans/<initiative>/`. Переход от заметки к инициативе описан в [README папки идей](../ideas/README.md#от-заметки-к-плану).

Папка в `docs/plans/` без результата `grilling` — ошибка: перенесите её в заметку. Остановленная инициатива остаётся в `docs/plans/` со статусом `parked`.

`HANDOFF.md` в `docs/plans/` не используется: продолжить работу в новой сессии помогают сжатие контекста и перенос сессии в самих инструментах.

## Артефакты инициативы

Канонические рабочие артефакты инициативы хранятся в репозитории:

```text
docs/plans/<initiative>/
├── README.md
├── SPEC.md
├── tickets/
├── research/
└── prototypes/
```

Закрытые инициативы переносить в `docs/plans/completed/<initiative>/` (не удалять по умолчанию). Active frontier не читать из `completed/`. Живые хвосты выносить в тематическую active-initiative, а не оставлять в archived map.

## Статусы

Список закрытый: других значений у инициатив и tickets нет. Значение — английский токен в строке `**Status:**` под заголовком файла. Пояснение допустимо после тире: `**Status:** parked — ждём API бэкенда`. Upstream skills статусы не описывают, поэтому канон здесь.

Статус инициативы пишется в одном файле: `README.md`, а если его нет — `SPEC.md`. В остальных файлах инициативы он не дублируется.

| Статус инициативы | Значение                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `shaping`         | `grilling` пройден; карта, `SPEC.md` или tickets ещё пишутся.       |
| `ready`           | `SPEC.md` согласован, tickets нарезаны, работу можно брать.         |
| `in-progress`     | Хотя бы один implementation ticket взят или закрыт.                 |
| `parked`          | Работа остановлена. После тире — причина и условие возврата.        |
| `done`            | Всё закрыто. Папка переезжает в `docs/plans/completed/`.            |
| `cancelled`       | От инициативы отказались. После тире — причина; папка тоже в архив. |

| Статус ticket     | Значение                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| `ready-for-agent` | Ticket полон по контракту ниже и ждёт исполнителя.                       |
| `claimed`         | Взят в работу.                                                           |
| `resolved`        | Acceptance criteria выполнены, evidence приложен.                        |
| `blocked`         | Ждёт внешнего события, которого нет в `Blocked by`. После тире — какого. |
| `cancelled`       | Делать не будут. После тире — причина.                                   |

Кто меняет статус:

- `wayfinder` или `to-spec` создаёт инициативу со статусом `shaping`. Связанные заметки в `docs/ideas/` в тот же момент получают `in-plan`.
- `to-tickets` ставит `ready`, когда каждая user story из `SPEC.md` закрыта ticket.
- `implement` ставит ticket `claimed` до правок и `resolved` после свежего `READY` и review — по разделам [«возьми ticket»](#когда-skill-говорит-возьми-ticket) и [«закрывает работу»](#когда-skill-закрывает-работу). С первым `claimed` инициатива становится `in-progress`.
- `done`, `parked` и `cancelled` ставит человек или агент по его запросу: закрытие инициативы — решение, а не следствие последнего ticket. С `done` и `cancelled` папка переезжает в `completed/`, а связанные заметки получают `closed`.

Файлы в `research/` и `prototypes/` этим списком не покрыты. Архив `docs/plans/completed/` под список задним числом не переписывается.

## Роли

- `README.md` — Wayfinder map: destination, границы, решения, fog и прогресс.
- `SPEC.md` — согласованное поведение: user stories, решения по реализации и тестированию.
- `tickets/` — независимые tracer-bullet slices и их зависимости.
- `research/` — результаты исследований по первичным источникам.
- `prototypes/` — временные артефакты для проверки решений.

## Публикация из skills

Upstream skills Мэтта (`wayfinder`, `to-spec`, `to-tickets`, `implement-spec`) ждут issue tracker, настроенный через `/setup-matt-pocock-skills`. Здесь его роль играет этот документ: tracker — repository Markdown в `docs/plans/`, setup запускать не нужно.

### Когда skill говорит «опубликуй в issue tracker»

- Spec — `docs/plans/<initiative>/SPEC.md`. Label `ready-for-agent` на spec не ставится: у `SPEC.md` своего статуса нет, готовность выражает статус инициативы.
- Tickets — по одному файлу на ticket: `docs/plans/<initiative>/tickets/<NN>-<slug>.md`, нумерация с `01` в порядке зависимостей. Статус `ready-for-agent` — строкой `**Status:**`.
- Map `wayfinder` — `docs/plans/<initiative>/README.md`, см. [Wayfinding operations](#wayfinding-operations).
- Артефакты пишутся на русском и коммитятся вместе с инициативой.

### Когда skill говорит «возьми ticket»

Прочитай файл по пути, который назвал пользователь, или найди ticket по номеру в `tickets/` инициативы, и назови его заголовок. Затем прочитай linked `SPEC.md`; правила под тип изменения открой по условиям из [CODING_STANDARDS.md](../../CODING_STANDARDS.md).

До правок проверь готовность:

- статус `ready-for-agent`, все tickets из `Blocked by` — `resolved`;
- есть acceptance criteria и границы scope;
- решения из spec доступны, существенных открытых вопросов нет;
- test seams определены настолько, насколько требует изменение;
- UI-ticket с нормативным дизайном: `Design acceptance` требует сравнение в этом ticket или ссылается на существующий closing ticket.

Факты найди в репозитории сам. Не хватает решения, источники конфликтуют или scope растёт — остановись с `NOT READY` и перечисли gaps; продуктовые требования не додумывай.

Готов — поставь ticket `**Status:** claimed`, а если это первый взятый ticket инициативы — инициативе `in-progress`. Во время работы остановись перед новой зависимостью, разрушительным действием, изменением внешней системы или решением, которого нет в ticket и spec и которое меняет публичный API или структуру домена.

Всю инициативу по графу tickets реализует `implement-spec` с [адаптацией](upstream-skills.md#implement-spec-в-этом-репозитории).

### Когда skill закрывает работу

- **Ticket.** Перед закрытием — свежий `READY` от `verify-change` и `review-changes` без 🔴 и 🟠. Design acceptance в этом ticket — `verify-change` сравнивает с названным источником, общего smoke мало. Тогда поставь `**Status:** resolved`; коммит ticket вместе со slice через `commit-changes` — по [Authority](../engineering/delivery.md#authority). Остановился раньше — ticket остаётся `claimed`, причина идёт в отчёт.
- **Отчёт** — через `summarize-changes`: реализованные AC, файлы и тесты, evidence, результат ревью, риски и непроверенное, оставшиеся ⚪.
- **Инициатива.** Последний открытый ticket — скажи об этом: `done` и перенос в `completed/` решает человек по [статусам](#статусы).

Upstream skills (`skills-lock.json`) **не патчить**: адаптации — в этом файле, [upstream-skills.md](upstream-skills.md) или project-owned skills. См. [AGENTS.md](../../AGENTS.md).

### Spec contract

`to-spec` пишет `docs/plans/<initiative>/SPEC.md` по шаблону upstream. Отличие одно: SPEC на русском — заголовки разделов в переводе, user story — «Как <актор>, я хочу <возможность>, чтобы <польза>». Доменные термины, имена API и полей, идентификаторы кода — на английском, где это канон продукта.

### Ticket contract

Каждый implementation ticket дополняет upstream template следующими полями:

```markdown
**Status:** ready-for-agent
**Blocked by:** <tickets или None>
**Testing strategy:** TDD | <исключение> — <причина>
**Test seams:** <pre-agreed seams или Not applicable>
**Design acceptance:** Not applicable | in this ticket: <source> | deferred to <конкретный blocking ticket>

## What to build

<законченный vertical slice с точки зрения пользователя>

## Scope

### In scope

- <разрешённая часть изменения>

### Out of scope

- <явно исключённая часть или None>

## Acceptance criteria

- [ ] <наблюдаемый результат>
```

`What to build` объясняет ценность slice, acceptance criteria задают проверяемую границу завершения. Scope предотвращает захват соседней работы и несвязанный refactor. Testing strategy по умолчанию — TDD; исключения — по [testing.md](../engineering/testing.md#testing-strategy-и-upstream-tdd).

### Cross-slice acceptance gates

При декомпозиции SPEC в tickets отдельно проверьте критерии, которые нельзя честно закрыть одним vertical slice: целостная визуальная композиция, миграция, end-to-end journey, compatibility matrix, security/performance gate.

- Если нормативный UI-дизайн реализуется несколькими tickets, создайте финальный conformance ticket, заблокированный всеми slices, которые формируют экран/flow.
- Каждый функциональный UI-ticket либо содержит собственный design evidence, либо явно ссылается в `Design acceptance` на этот closing gate.
- `resolved` функционального ticket не означает готовность целого экрана/flow, пока closing gate не resolved.
- Нельзя заменять такой ticket общим `buffer`, `full smoke` или неразмеченным «проверим в конце».
- Перед публикацией tickets сопоставьте каждую user story из SPEC с одним или несколькими tickets; story без ticket означает неполную декомпозицию.

Это project override для upstream `to-tickets`: upstream skill не редактируется.

## Внешний трекер

Внешний трекер (Jira, Linear, YouTrack) используется для отображения текущей работы. Он не является источником требований. При наличии задачи во внешнем трекере её ключ (`{{TICKET_KEY}}-123`) и ссылка добавляются в локальный ticket; полное требование остаётся в repository Markdown.

## Wayfinding operations

Upstream `wayfinder` описывает map и tickets в терминах issue tracker. В repository Markdown они выражаются так:

- Map с label `wayfinder:map` — `docs/plans/<initiative>/README.md`.
- Child issue — файл в `docs/plans/<initiative>/tickets/`. Label `wayfinder:<type>` — поле `Type`.
- Native blocking — поле `Blocked by` со ссылками на tickets.
- Claim через assignee — `Status: claimed` до начала работы.
- Закрытие issue — `Answer` и evidence в ticket, затем `Status: resolved`; краткое решение со ссылкой — в `README.md`.
- Frontier — tickets без `claimed` и `resolved`, у которых каждый ticket из `Blocked by` уже `resolved`.
- Ticket содержит `Type`, `Status`, `Blocked by` и `Question`.
- Throwaway-ветка `research/<name>` с push — файл в `docs/plans/<initiative>/research/`; ветку не создаём и не пушим.
