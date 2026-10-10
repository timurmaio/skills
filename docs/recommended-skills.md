# Сторонние скиллы

Эти скиллы ставятся в каждый проект. Они дают агенту готовый сфокусированный workflow под конкретную задачу: чеклисты, практики и ограничения, вместо того чтобы каждый раз собирать процесс заново.

Это не скиллы из этого репозитория. Свои скиллы (`feature-modules`, `ui-conventions`) ставятся отдельно, см. [README](../README.md).

| Скилл | Источник |
| --- | --- |
| `frontend-design` | `anthropics/skills` |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` |
| `web-design-guidelines` | `vercel-labs/agent-skills` |
| `vercel-composition-patterns` | `vercel-labs/agent-skills` |

## Установка

Из корня проекта:

```bash
./scripts/install-third-party.sh
```

Те же команды по одной:

```bash
npx skills add https://github.com/anthropics/skills --skill frontend-design
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns
```

CLI спросит, в какие агенты ставить скиллы, если запуск интерактивный.

Анонимная телеметрия CLI отключается переменной `DISABLE_TELEMETRY=1` (или `DO_NOT_TRACK=1`):

```bash
DISABLE_TELEMETRY=1 ./scripts/install-third-party.sh
```
