# Flow: какой skill когда брать

Памятка для разработчиков и ревьюеров: как проходить единый цикл работы с агентом и какой skill брать на каждом этапе. Hard guardrails — в [AGENTS.md](../../AGENTS.md), как устроен сам сетап — в [setup.md](setup.md), детали этапа — в `.agents/skills/<name>/SKILL.md`.

## Содержание

- [Единый цикл](#единый-цикл)
- [Как формулировать запрос](#как-формулировать-запрос)
- [Выбор skill](#выбор-skill)
- [Коммиты](#коммиты)

## Единый цикл

1. Сформулировать цель и границы изменения.
2. Выполнить реализацию или диагностику подходящим skill.
3. Собрать свежий evidence через `verify-change` или применимую project-команду.
4. Запустить `review-changes`. Правит ли он найденное сам и коммитит ли агент slice через `commit-changes` — по [Authority](../engineering/delivery.md#authority).
5. Подготовить MR/PR handoff через `summarize-changes`.

Skills не создают независимые процессы: они стандартизируют отдельные этапы этого workflow.
Ранний статический review можно выполнить до `READY`, чтобы найти дефекты, но он обязан отметить отсутствующий evidence и не заменяет финальную последовательность verification → review.

## Как формулировать запрос

- Можно описать цель обычным языком: «проверь diff», «разбери падение CI», «создай домен».
- Если нужен предсказуемый workflow, назовите skill явно.
- Что агент коммитит сам, а что запрашивается явно — [delivery workflow](../engineering/delivery.md#authority).
- Релизы, публикации пакетов и другие внешние действия — только явным именем project skill с `disable-model-invocation: true`: агент не стартует их сам.

## Выбор skill

Человек запускает только точки входа из флоу, ситуативные и рутину; остальные вызываются внутри связок. Skills со слешем (`disable-model-invocation`) запускаются только командой пользователя. Полный список определяется содержимым `.agents/skills/`, пошаговые инструкции — в их `SKILL.md`.

### Флоу разработчика

Путь выбирается по размеру задачи.

| Задача                         | Путь                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Маленькая и понятная задача    | Описать цель и критерий готовности → агент реализует, проверяет и ревьюит; коммит — по Authority                                  |
| Баг, упавший тест, lint или CI | `systematic-debugging` → фикс с регрессионным тестом. CI — по шагам [CI failure loop](../engineering/delivery.md#ci-failure-loop) |
| Фича среднего размера          | `grilling` → `/to-spec` → `/to-tickets` → `/implement` на каждый ticket или `/implement-spec` на все                              |
| Инициатива больше одной сессии | `/wayfinder` → решения по его tickets → `/to-spec` → `/to-tickets` → `/implement-spec`                                            |
| Сдача                          | `summarize-changes` — описание MR/PR; замечания ревью и комментарии к MR/PR — `receiving-code-review`                             |

### Связки: что вызывается само

| Что запущено                           | Сам вызывает                                                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Любая правка кода                      | `test-driven-development` по [testing.md](../engineering/testing.md), `verify-change`, `review-changes` и `commit-changes` по правилам «Готово» и «Коммиты» в `AGENTS.md`                              |
| `implement`                            | `test-driven-development`, `review-changes` в субагенте; по `AGENTS.md` и [issue-tracker](issue-tracker.md#когда-skill-говорит-возьми-ticket) — `verify-change`, `summarize-changes`, `commit-changes` |
| `implement-spec`                       | `implement` в субагенте на каждый ticket, в конце `review-changes` по всей ветке                                                                                                                       |
| `review-changes`                       | `verify-change` после своих правок                                                                                                                                                                     |
| `systematic-debugging`                 | `test-driven-development` для регрессионного теста, `verify-change`                                                                                                                                    |
| `wayfinder`                            | `research`, `prototype`, `grilling`, `domain-modeling` — по типу ticket                                                                                                                                |
| `correct`, правка skills и `AGENTS.md` | `writing-for-agents` — как писать текст для агента                                                                                                                                                     |

Руками `test-driven-development`, `verify-change`, `research`, `prototype`, `domain-modeling` и `writing-for-agents` не вызывай — разве что как отдельный вопрос: «готово ли это?», «проверь факт», «собери макет», «уточни термин».

### Ситуативные

| Задача                                           | Skill            |
| ------------------------------------------------ | ---------------- |
| Понять, что изменилось и какие решения ждут тебя | `catch-up`       |
| Записать идею или техдолг на потом               | `capture-idea`   |
| Закоммитить вне `implement`                      | `commit-changes` |

`review-changes` можно запустить и напрямую; режим fix или read-only — по [Authority](../engineering/delivery.md#authority) и просьбе пользователя, для чужого кода — всегда read-only.

Правила написания и ревью тестов живут в [engineering/testing.md](../engineering/testing.md), а не в отдельном workflow skill.

## Коммиты

Коммиты через agent workflow следуют Conventional Commits; детали — в `.agents/skills/commit-changes/CONVENTIONAL_COMMITS.md`.

Условия локального commit при failed check — в [delivery workflow](../engineering/delivery.md#локальный-commit-при-failed-check).
