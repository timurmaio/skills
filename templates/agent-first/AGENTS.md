# Руководство для агентов

## Всегда

- **Язык.** С пользователем и в human-facing документации — русский, пока пользователь явно не попросил другой.
- **Ответ.** Начинай с вывода простыми словами, для сложного — с примера; детали реализации ниже и только нужные. Вопрос, который ждёт ответа пользователя, ставь отдельной строкой в конце.
- **Вопросы.** Ответ, который можно получить самому — запустить, открыть в браузере, прочитать код, — получи сам. У пользователя спрашивай решения: продукт, scope, полномочия.
- **Scope правки.** Меняй только место, где проблема зарепорчена или описана в задаче. Соседние версии и режимы того же сценария оставляй как есть и проверь на регресс; та же проблема там — сообщи пользователю.
<!-- variant authority=autonomous -->
- **Готово.** Задача с правкой кода закончена только после `verify-change` и `review-changes` в режиме fix — с ticket и без.
- **Коммиты.** Готовый slice коммить локально сам через `commit-changes`, когда обязательные checks прошли: только изменения своей задачи. В `{{MAIN_BRANCH}}` без явного запроса коммить только документацию; slice с кодом в `{{MAIN_BRANCH}}` не коммить — остановись и предложи ветку. Ветку, `git push`, MR/PR, merge и release выполняй только по явному запросу.
<!-- /variant -->
<!-- variant authority=on-request -->
- **Готово.** Задача с правкой кода закончена только после `verify-change` и `review-changes` — с ticket и без. Ревью по умолчанию только читает: findings исправляй после решения пользователя.
- **Коммиты.** Коммить только по просьбе пользователя, через `commit-changes`. Ветку, `git push`, MR/PR, merge и release выполняй только по явному запросу.
<!-- /variant -->
- **Skills.** Живут в `.agents/skills/<name>/SKILL.md`. Upstream skills зовут соседей по своим именам (`tdd`, `code-review`); соответствие — в [upstream-skills.md](docs/agents/upstream-skills.md#ссылки-upstream-skills-на-соседей). Skill, названный пользователем или подходящий задаче по `description`, прочитай до начала работы. Skills из `skills-lock.json` (vendored upstream) оставляй как в upstream, на месте не патчи (проверяет `pnpm lint:skills`): адаптацию пиши в `docs/agents/` или в project-owned skill рядом.
- **Env.** Значения из `{{APP_ENV_FILE}}` и `.env.browser.local` не читай и не выводи. Начиная работу в git worktree, выполни `pnpm env:copy`: он скопирует env из основного checkout ([подробнее](docs/agents/setup.md#worktree-и-локальный-env)).

## Открывай по условию

| Когда открывать                                                               | Документ                                                     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Пишешь код, тесты, конфиг: разделы «Для каждого изменения» и «При реализации» | [CODING_STANDARDS.md](CODING_STANDARDS.md)                   |
| Ревьюишь код: весь документ                                                   | [CODING_STANDARDS.md](CODING_STANDARDS.md)                   |
| Коммит: границы `{{MAIN_BRANCH}}`, failed check; MR/PR handoff, CI и review loop | [docs/engineering/delivery.md](docs/engineering/delivery.md) |
| Выбор skill под задачу                                                        | [docs/agents/flow.md](docs/agents/flow.md)                   |
| Правка `AGENTS.md`, skills, хуков и agent-документов                          | [docs/agents/setup.md](docs/agents/setup.md)                 |
| Сырые идеи и техдолг                                                          | [docs/ideas/README.md](docs/ideas/README.md)                 |

## Agent skills

### Issue tracker

Repository Markdown: инициативы, `SPEC.md` и tickets — в `docs/plans/`, сырые идеи — в `docs/ideas/`. См. [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Domain docs

Multi-context: `GLOSSARY-MAP.md` в корне ведёт к `GLOSSARY.md` доменов. См. [docs/agents/domain.md](docs/agents/domain.md).
