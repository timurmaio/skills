# Стандарты кода

## Для каждого изменения

- Комментарии в коде и названия тестов — {{CODE_COMMENTS_LANGUAGE}}; идентификаторы и имена файлов — на английском.
- Файл не больше 5 000 токенов (байты / 4): большой файл агент читает не целиком. Проверяет `pnpm lint:size`; файлы, которые уже больше, перечислены в `scripts/baselines/file-size.json` и не растут — новое пиши в отдельный файл.
- Перед сдачей изменения выполни `pnpm verify`: статические проверки (`pnpm check`) и все тесты. Какие targeted checks нужны твоему изменению до него — в [verification.md](docs/engineering/verification.md).

## При реализации — открой по условию

Документы, которые задают структуру и контракты. Стиль и качество проверяет и исправляет `review-changes` в отдельном проходе: у реализатора контекст занят поиском, правками и отладкой.

- Домен в `{{FEATURES_DIR}}/`: создание, структура, публичный API, место общего кода → [features.md](docs/engineering/features.md)
- Форма: валидация, submit, фокус на ошибке, server errors → [forms.md](docs/engineering/forms.md)
- Таблица: какой компонент брать, selection → [tables.md](docs/engineering/tables.md)
- Интерактивный элемент, поле формы, виджет или строка коллекции: `data-testid` для E2E и нейминг → [e2e.md](docs/engineering/e2e.md)
- Событие продуктовой аналитики → [analytics.md](docs/engineering/analytics.md)
- Verification, локальные процессы, design conformance, evidence report → [verification.md](docs/engineering/verification.md)
- Проверка в браузере: запуск, авторизация, Doctor, cleanup → [browser-testing.md](docs/engineering/browser-testing.md)

<!-- Сюда же — документы доменов, которые меняют реализацию: «<домен>: <что> → [DOC.md]({{FEATURES_DIR}}/<domain>/docs/DOC.md)». -->

## При ревью — дополнительно

- React, TypeScript или CSS: стек и общие принципы → [styleguide.md](docs/engineering/styleguide.md); именование, логика и TypeScript → [code.md](docs/engineering/code.md); компоненты и стабильность ссылок → [react.md](docs/engineering/react.md); стили → [styling.md](docs/engineering/styling.md)
- Интерактивный элемент: ARIA, tooltip или hint, disabled и async-ожидание → [accessibility.md](docs/engineering/accessibility.md)
- Тест, mock, fixture, testing strategy → [testing.md](docs/engineering/testing.md)
