# Browser verification

[Карта инженерной документации](../../CODING_STANDARDS.md).

Как агент сам проверяет изменение в реальном браузере. Это developer verification, а не QA regression suite: агент заменяет ручной проход разработчика после реализации, а QA по-прежнему владеет требованиями, test cases и постоянной автоматизацией.

## Содержание

- [Контракт](#контракт)
- [Credentials и авторизация](#credentials-и-авторизация)
- [Запуск](#запуск)
- [Выбор сценариев](#выбор-сценариев)
- [Cleanup](#cleanup)
- [Evidence report](#evidence-report)

## Контракт

Канонический интерфейс — `pnpm browser:*` scripts и этот документ. Он не зависит от Codex, Cursor, Claude или модели: любой агент с shell выполняет одинаковые команды и возвращает одинаковый evidence report.

Браузером управляет pinned dependency `agent-browser`. Сценарии агент выбирает по ticket, diff и acceptance criteria; как дойти до фичи и что доказывает результат — в [карте фич](../../.agents/skills/verify-change/features/README.md). Постоянный browser test добавляется только по отдельному решению владельца тестовой стратегии.

## Credentials и авторизация

Credentials лежат в ignored `.env.browser.local` основного checkout:

```dotenv
BROWSER_USER_EMAIL="dedicated-dev-user@example.com"
BROWSER_USER_PASSWORD="secret"
```

Значения — в кавычках: без них dotenv считает `#` и остаток строки комментарием, и агент отправит усечённый пароль. Если значение содержит двойную кавычку, возьмите всю строку в одинарные.

Credentials принадлежат выделенному dev-only пользователю с минимальными правами. Агент не выводит значения env, не передаёт пароль аргументом CLI (email уходит аргументом `--username`: `agent-browser` не принимает его иначе) и не читает cookies, storage или содержимое auth vault.

Worktree получает копии env-файлов из основного checkout:

```bash
pnpm env:copy
```

Копия, а не symlink: окружение worktree можно поменять, не задевая остальные. Существующий файл команда не перезаписывает и значения не выводит. `.env.local` обязателен, `.env.browser.local` — только для authenticated browser verification.

Авторизация:

```bash
pnpm browser:login
pnpm browser:login -- --headed   # то же в видимом окне
```

По умолчанию harness запускает изолированный headless Chromium, свой на каждый worktree. После `--headed` все `pnpm browser -- ...` работают с той же видимой сессией. Личный Chrome-профиль разработчика не используется: его cookies, расширения и состояние делают проверку невоспроизводимой и расширяют доступ агента.

Script передаёт пароль в encrypted auth vault `agent-browser` через stdin и логинится через форму входа приложения (URL и селекторы полей — константы в `scripts/browserRuntime.mts`). Куда уходит запрос входа, решает форма, а не script. Успех — уход приложения со страницы входа, exit code браузера сам по себе не доказательство. При ошибке script очищает поля и закрывает сессию. Если после входа приложению нужна подготовка (включить feature flags в dev, выбрать аккаунт) — она живёт в `afterLogin` того же файла, а Doctor её проверяет. Секреты удаляются из env дочернего browser process, модель их не получает.

В CI те же `BROWSER_USER_EMAIL` и `BROWSER_USER_PASSWORD` задаются masked/secret variables; файл не нужен, auth vault и сессия живут внутри job. Job с секретами не запускается для недоверенного fork/MR-кода, debug trace для него запрещён.

## Запуск

Один раз после установки dependencies:

```bash
pnpm browser:install
```

Каждый проход:

1. Прочитать ticket, diff и acceptance criteria; выписать изменённые пользовательские сценарии и найти их в карте фич.
2. `pnpm env:copy`.
3. Узнать порт этого checkout: `pnpm -s browser:port`. Основной checkout получает `{{DEV_PORT}}`, каждый worktree — свой постоянный порт, поэтому агенты в разных worktree проверяют параллельно. Порт занят чужим или пользовательским процессом — вернуть `BLOCKED`, процесс не трогать.
4. Запустить `pnpm dev --port <порт>` как контролируемый long-running process. Если backend пускает только фиксированные origin (CORS), разрешите в dev-контуре весь диапазон портов worktree; иначе параллельная проверка невозможна и проверку ведёт один агент.
5. `pnpm browser:login`.
6. `pnpm browser:doctor` — read-only проверка, что экземпляр годится: env на месте, порт занят сервером этого worktree, сервер отвечает, сессия авторизована, подготовка после входа выполнена. Повторять после любого неожиданного поведения и после упавшего шага; при `FAIL` чинить окружение, а не продолжать сценарий.
7. Управлять браузером через `pnpm browser -- <command>`. Начинать со snapshot, после навигации или заметного изменения DOM брать новый. Повторный snapshot — с `--delta`: он возвращает только изменения, а без них — `unchanged`. Флаги держите одинаковыми: со сменой `-i` snapshot снова приходит целиком; `--full` сбрасывает базу сравнения.

```bash
pnpm browser -- snapshot -i --json
pnpm browser -- snapshot -i --delta
pnpm browser -- screenshot browser-artifacts/<ticket>/<scenario>.png
pnpm browser -- console --json
pnpm browser -- errors --json
```

Refs из snapshot живут до следующего изменения страницы. Предпочитайте `find role`, `find label` и refs; CSS selectors — только без устойчивой доступной семантики.

Сеть для evidence — только `pnpm browser:network`: метод, host и path без query, статус. `-- --mutations` оставляет POST, PUT, PATCH и DELETE, `-- --clear` очищает журнал перед сценарием. Сырой `network requests --json` содержит headers и body — в контекст агента его не выводить. Cookies, storage, authorization headers и POST body не читаются и в отчёт не попадают.

## Выбор сценариев

Проход — не фиксированная suite. Агент проверяет только наблюдаемое поведение, которое затронул diff:

- happy path и материальный boundary/error state изменённой логики;
- navigation, loading и persistence, если они входят в изменённый контракт;
- отсутствие новых console errors и failed network requests в пройденном сценарии;
- внешний вид через screenshot, только когда diff затрагивает визуальную композицию.

Доказательство — действие и его результат, а не только финальный экран: для mutation — запрос и его статус плюс сохранённое состояние после reload. Если в карте у фичи несколько входов, а diff задевает общий код, пройти каждый вход.

Не нужно проходить всё приложение или превращать каждое исправление в committed E2E test. Найден воспроизводимый дефект — решение о постоянном regression test по [testing.md](testing.md) и зоне владения QA.

Не хватает предусловия (данных, флага, аккаунта) — сценарий `blocked` с причиной; ослаблять сценарий, чтобы он прошёл, нельзя. Новое предусловие дописать в раздел «Подводные камни» нужной фичи в карте.

## Cleanup

В `finally`-эквиваленте любого прохода — успешного, упавшего или прерванного:

1. `pnpm browser -- close`.
2. Остановить только свой `pnpm dev` через `SIGINT` и дождаться завершения. Никогда не убивать процессы по имени.
3. Проверить, что порт этого checkout свободен.
4. Не оставлять browser session, dev-server, Storybook или watch-процесс.

Cleanup не удаляет evidence: screenshots остаются в ignored `browser-artifacts/`. После cleanup проверить, что они на месте.

## Evidence report

Вернуть:

- environment и URL;
- проверенные сценарии из AC;
- ожидаемый и наблюдаемый результат каждого;
- `pass`, `fail` или `blocked`;
- console/network evidence при ошибке;
- screenshot, когда он помогает оценить UI, с путём в `browser-artifacts/`;
- подтверждение закрытия сессии, остановки сервера и освобождения порта;
- ограничения и непройденные сценарии.

Mutating-сценарии требуют разрешённого dev-контура, контролируемых данных и cleanup. Какие аккаунты и сущности агенту можно создавать и менять и как их называть — в «Подводных камнях» фичи в [карте фич](../../.agents/skills/verify-change/features/README.md).
