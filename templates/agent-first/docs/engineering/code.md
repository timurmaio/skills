# Код: именование, логика, TypeScript

[Карта инженерной документации](../../CODING_STANDARDS.md). Часть [styleguide](styleguide.md); пометки «Lint:» — как там.

## Содержание

- [Именование](#именование)
- [Логика и Функции](#логика-и-функции)
- [Переводы (i18n)](#переводы-i18n)
- [TypeScript](#typescript)
- [Утилиты и кейсы](#утилиты-и-кейсы)
- [Type Assertions](#type-assertions)

## Именование

- **Вложенные компоненты:** Добавляйте префикс модуля (например, `LayoutHeaderLink` вместо просто `Link` в модуле Layout) — это упрощает дебаг и поиск.
- **Описательность:** Имена должны быть ясными и отражать суть сущности. Избегайте сокращений и однобуквенных переменных (кроме итераторов в циклах). Используйте доменные термины: `columnMinSize` вместо `min`, `validatedSizes` вместо `result`.
- **Смысл, а не текущий transport:** Называйте общие capabilities, controls и business rules по назначению. То, что возможность пока поддерживает только один API, не делает её `Legacy`. Такой префикс уместен для действительно version-specific adapter, transport или оболочки маршрута.
- **Доменные термины:** В текстах, ключах переводов и внутренних идентификаторах используйте термин из `GLOSSARY.md` домена. Синоним из внешнего API, схемы, legacy-данных или стороннего сервиса допустим только на границе этого контракта.
- **Имена файлов:** Должны соответствовать основному экспорту: `MyComponent.tsx` для компонентов, `useDataFetching.ts` для хуков, `dataTransformers.ts` для утилит.
- **Константы:** Переменные-константы объявляйте через `UPPER_SNAKE_CASE` (например, `const SOME_CONSTANT = { ... };`).
- **Ключи browser storage:** Ключи для `localStorage`, `sessionStorage` и `cookie` именуйте в `kebab-case` с префиксом проекта `{{PROJECT}}-` (например, `"{{PROJECT}}-utm-notice-pending"` или `"{{PROJECT}}-statistics-table-columns-config"`). Имя JS-константы для такого ключа при этом остаётся в `UPPER_SNAKE_CASE`.
- **Search params приложения:** Новые ключи URL query именуйте в `camelCase`: `pageSize`, `accountId`, `copyFromItemId`, `copyMode`. Это соглашение для консистентности с существующими URL, а не техническое преимущество перед `kebab-case`.
- **Идентификаторы в search params:** Для идентификатора сущности используйте суффикс `Id`, для списка идентификаторов — `Ids`: `accountId`, `projectIds`, `copyFromItemId`. Имя отражает назначение: `copyFromItemId` — источник копирования, `copyMode` — режим копирования.
- **Значения режимов в search params:** Новые строковые значения перечислений именуйте строчными словами; несколько слов разделяйте дефисом: `bulk`, `add-source`. Произвольные пользовательские значения и идентификаторы не преобразуйте под этот стиль.
- **Внешние query-контракты и совместимость:** Имена и значения параметров API, OAuth и сторонних ссылок сохраняйте по внешнему контракту. Существующие URL приложения не переименовывайте только ради нового соглашения: изменение требует явного решения о совместимости.
- **Аббревиатуры:** В camelCase/PascalCase, а не ALL_CAPS внутри слова (например, `ApiEndpoint`, `HttpClient`, `CellUtm`; не `APIEndpoint`, `HTTPClient`, `CellUTM`).
- **"Следующий" vs "Новый":** Для переменных, которые представляют "следующий" массив/объект, вычисленный из предыдущего, используйте префикс `next` вместо `new`. Префикс `new` используется только для создания совершенно новых сущностей.

  ```tsx
  // ПЛОХО: new для "следующего" значения
  const newFilters = typeof updater === "function" ? updater(filters) : updater;
  const newSelection = updater(selection);

  // ХОРОШО: next для "следующего" значения
  const nextFilters = typeof updater === "function" ? updater(filters) : updater;
  const nextSelection = updater(selection);

  // ХОРОШО: new для создания новой сущности
  const newId = crypto.randomUUID();
  const newScenario = createEmptyScenario();
  ```

## Логика и Функции

- **Объявление функций:** Функции уровня модуля объявляйте через `function` (`function doSomething() { ... }`): это обеспечивает hoisting и упрощает отладку в стеке вызовов. Lint: `func-style: ["error", "declaration", { allowTypeAnnotation: true }]` — переменную с явным типом функции (`const handler: Handler = () => ...`) он не трогает. Стрелочные функции внутри компонентов и хуков — норма.
- **Чистота функций:** Стремитесь писать чистые функции, которые не имеют побочных эффектов и возвращают одинаковый результат при одинаковых входных данных.
- **Параметры функций:** Объявляйте обязательный объект входных параметров через интерфейс `Params`. Для объекта настроек поведения используйте `Options`, если большинство полей optional/defaultable или объект расширяется как конфигурация. Optional параметры должны иметь дефолтные значения. Исключение: если у функции один примитивный параметр, интерфейс можно не объявлять.
- **Неиспользуемые параметры:** Если параметр не используется, удаляйте его из сигнатуры. Не оставляйте заглушки вроде `_error`, `_event`, `_value`, если колбэк или функция корректно работают без них.
- **useCallback:** Не добавляйте `useCallback` автоматически. Используйте его только когда есть понятная причина: мемоизированный дочерний компонент, стабильная зависимость для эффекта, подписка/отписка на event listener или другая логика, чувствительная к ссылочной идентичности.
- **Избегайте `else if`:** Используйте `else if` только в крайних случаях. Предпочитайте ранние возвраты (`early return`) или отдельные `if` блоки для улучшения читаемости. Lint: `no-else-return`.

  ```tsx
  // ПЛОХО: цепочка else if с ранними возвратами
  if (condition1) {
  	return value1;
  } else if (condition2) {
  	return value2;
  } else if (condition3) {
  	return value3;
  }
  return defaultValue;

  // ХОРОШО: ранние возвраты без else if
  if (condition1) {
  	return value1;
  }
  if (condition2) {
  	return value2;
  }
  if (condition3) {
  	return value3;
  }
  return defaultValue;
  ```

  **Исключение:** Если `return` у вас один и только после проверки всех условий, то `else if` допустим:

  ```tsx
  // ХОРОШО: один return в конце, else if допустим
  let result;
  if (condition1) {
  	result = value1;
  } else if (condition2) {
  	result = value2;
  } else if (condition3) {
  	result = value3;
  } else {
  	result = defaultValue;
  }
  return result;
  ```

  ```tsx
  // ПЛОХО: useCallback без причины
  const handleClick = useCallback(() => {
  	onClick(data);
  }, [onClick, data]);

  // ХОРОШО: простая функция без мемоизации
  function handleClick() {
  	onClick(data);
  }

  // ХОРОШО: useCallback, когда стабильная ссылка действительно нужна
  const handleClick = useCallback(() => {
  	setCount((prev) => prev + 1);
  }, []);
  ```

## Переводы (i18n)

- **Ключи переводов:** Сегменты namespace используют `PascalCase` (например, `Accounts` или `UI.MultiSelect`), а конечные message keys — `kebab-case` (например, `"error-message"`, `"user-name"`). Одинаковый набор ключей во всех локалях должна проверять команда в `pnpm check`.
- **Структура:** Один namespace соответствует одной согласованной области переводов и подключается под одним и тем же именем везде. Переводы для заголовков страниц используют ключ `title`. Детали интеграции домена — в [features.md](features.md#интеграции-домена).
- **Маппинг API ошибок:** При работе с ошибками из API (которые могут быть в `PascalCase` или другом формате) необходимо сначала создать маппинг на ключи переводов в `kebab-case`, а затем использовать эти ключи в файлах переводов. Сырой текст ошибки API (`detail`, `message`) в интерфейс не выводится.

  ```tsx
  // ПЛОХО: прямое использование API ошибки как ключа перевода
  const errorKey = `logs.errors.${errorType}`; // errorType = "UnknownError"

  // ХОРОШО: маппинг API ошибок на kebab-case ключи с as const
  const ERROR_TYPE_TO_TRANSLATION_KEY = {
  	UnknownError: "unknown-error",
  	UpstreamUnavailableError: "upstream-unavailable-error",
  } as const satisfies Record<ActionLogErrorType, string>;
  const translationKey = ERROR_TYPE_TO_TRANSLATION_KEY[errorType];
  const errorKey = `logs.errors.${translationKey}`;
  ```

## TypeScript

- **interface vs type:** Собственные plain-object контракты, включая props, объявляйте через `interface`. Unions, tuples, primitives, mapped/conditional types и контракты, производные через utility types, объявляйте через `type`. Не создавайте пустой или искусственный `interface` только ради запрета `type`.
- **Import types:** Используйте `import type` для импорта только типов. Для смешанных импортов: `import { type SomeType, fooBar } from "module"`.
- **React-типы:** Не используйте неймспейсные типы вида `React.ReactNode`. Для React-типов используйте отдельные type-импорты (например, `import type { ReactNode } from "react"`).

## Утилиты и кейсы

- **Переиспользование:** Перед созданием helper проверьте `src/utils`, домен-владелец и уже установленные библиотеки, в том числе `es-toolkit`. Не дублируйте подходящую по контракту функцию. Место новой утилиты определяйте по [доменной ответственности](features.md#владение-переиспользуемым-кодом), а не по количеству потребителей.
- **Проверка конечности числа:** Для проверки, что значение — конечное число (не ±`Infinity` и не `NaN`), используйте `Number.isFinite(value)`. Оно не преобразует входящее значение к числу. То же для `Number.isNaN`; Lint: `no-restricted-globals` для `isFinite` и `isNaN`.
- **HTTP-статус ошибки API:** Статус ошибки запроса читается одним helper из `src/api/helpers`, а не разбирается на месте (`x.response.status`, текст ошибки). Закрепите это lint-правилом, которое называет helper в сообщении.
- **React Aria:** Компоненты и хуки React Aria импортируйте с `Aria`-алиасом, если имя может конфликтовать с компонентами проекта: `import { Button as AriaButton } from "react-aria-components";`. Это помогает отличать внешние primitives от UI-компонентов проекта.
- **Select-подобные компоненты React Aria:** В UI-обёртках проекта используйте `value` и `onChange` вместо `selectedKey` и `onSelectionChange`, чтобы API был согласован с обычными form-контролами. При `selectionMode="multiple"` `value` и `onChange` принимают массив.

## Type Assertions

- **Избегайте type assertions:** Type assertions (`as Type`) должны использоваться только в крайнем случае, когда TypeScript не может автоматически вывести правильный тип, и нет другого способа решить проблему.
- **Предпочитайте выведение и проверку типов:** Используйте `as const`, `satisfies`, type guards и другие механизмы TypeScript вместо assertions. Helper безопаснее assertion только тогда, когда действительно доказывает контракт статически или проверяет значение в runtime; перенос `as Type` внутрь функции не делает код безопаснее.

### Пример

```tsx
// ПЛОХО: ненужный type assertion
const value = someFunction() as MyType;

// ХОРОШО: использование as const для выведения типа
const ERROR_MAP = {
	key1: "value1",
	key2: "value2",
} as const;

// ХОРОШО: type guard проверяет значение до сужения типа
const MY_TYPE_VALUES = ["key1", "key2"] as const;
type MyType = (typeof MY_TYPE_VALUES)[number];

function isMyType(value: string): value is MyType {
	return MY_TYPE_VALUES.some((candidate) => candidate === value);
}
```
