# skills

Общие скиллы для AI-first разработки. Ставятся в проект через CLI [`skills`](https://github.com/vercel-labs/skills) — и в репозиторий на GitHub, и в репозиторий на self-hosted GitLab. CLI кладёт скилл в рабочую копию проекта; хост git на установку не влияет.

CLI ищет `skills/<имя>/SKILL.md` с фронтматтером `name` и `description`. Копируется папка скилла целиком, поэтому справочные файлы лежат внутри неё.

## Скиллы

| Скилл | О чём |
| --- | --- |
| `feature-modules` | Фича как deep module: фасад `index.ts`, без `export *`, импорт только из корня фичи, alias и ESLint. |
| `ui-conventions` | Не ставить `cursor: pointer` на кнопки. Курсор-рука — конвенция для ссылок. |

Сторонние скиллы, которые ставятся в каждый проект отдельно от этого репозитория: [docs/recommended-skills.md](docs/recommended-skills.md).

## Установка

Следить за веткой по умолчанию:

```bash
npx skills add timurmaio/skills
```

Закрепить версию. Фрагмент `#v0.1.0` — git-тег, его разбирает CLI (`owner/repo#ref`, ref уходит в `git clone --branch`, поэтому подходят и ветка, и тег):

```bash
npx skills add timurmaio/skills#v0.1.0
```

Тег `v0.1.0` публикуется отдельно. Пока тега нет, ставь без фрагмента.

Список скиллов без установки:

```bash
npx skills add timurmaio/skills --list
```

## Обновление

```bash
npx skills update
```

`skills update` ставит заново тот ref, который записан при установке. Для `timurmaio/skills#v0.1.0` это снова тег `v0.1.0`: тег не двигается, и update не переходит на следующую версию. Чтобы сменить версию, добавь скиллы ещё раз с новым тегом:

```bash
npx skills add timurmaio/skills#v0.2.0
```

Без фрагмента установка идёт с ветки по умолчанию, и `npx skills update` подтягивает новые коммиты этой ветки.

## Телеметрия

CLI `skills` отправляет анонимную телеметрию на `skills.sh`. Отключение:

```bash
DISABLE_TELEMETRY=1 npx skills add timurmaio/skills
```

То же делает `DO_NOT_TRACK=1`. Любое непустое значение `DISABLE_TELEMETRY` выключает телеметрию.
