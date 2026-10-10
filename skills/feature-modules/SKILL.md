---
name: feature-modules
description: Design frontend features as deep modules with one public index.ts facade, explicit exports, no export *, import boundaries, a root-only path alias, and an ESLint rule. Use when adding, moving, or reviewing a feature module.
---

# Фич-модули

Фича — глубокий модуль: один публичный фасад и вся реализация внутри папки. Перед новой фичей или сменой её границы прочитай [references/deep-modules.md](references/deep-modules.md).

## Когда применять

- Новая папка в `features/`.
- Перенос UI, модели, типов или хелперов, которые относятся к одной фиче.
- Ревью импортов между фичами.

## Структура

Всё, что относится к фиче, живёт в её папке: UI, модель, типы, хелперы. Снаружи нет импортов по внутренним путям вроде `features/auth/ui/...`. Только корень фичи.

```text
features/
  auth/
    ui/
      login-form.tsx
      logout-button.tsx
    model/
      use-auth.ts
      auth-store.ts
      auth-api.ts
      auth.types.ts
    lib/
      map-auth-error.ts
    index.ts
```

`auth` — пример имени. Хелперы конкретной фичи остаются в её `lib/`, а не в общем абстрактном `lib/`.

Внутри фичи файлы импортируют друг друга относительными путями. Эти пути не являются публичным API.

## Фасад `index.ts`

`index.ts` — контракт фичи, а не `export *`. Наружу выходит только то, что перечислено явно. При экспорте символ можно переименовать, если так понятнее контракт.

```ts
// features/auth/index.ts

export { LoginForm } from "./ui/login-form";
export { LogoutButton } from "./ui/logout-button";

export { useAuth } from "./model/use-auth";

export type { AuthUser, AuthStatus } from "./model/auth.types";
```

Переименование на границе:

```ts
export { LoginForm as AuthLoginForm } from "./ui/login-form";
```

Так нельзя:

```ts
export * from "./ui";
export * from "./model";
export * from "./lib";
```

`export *` формально даёт точку входа, но вываливает наружу случайные сущности, делает их случайно публичными и размывает контракт: и человек, и агент перестают видеть, чем можно пользоваться.

## Импорты снаружи

Разрешён один путь:

```ts
import { LoginForm, useAuth } from "@/features/auth";
import type { AuthUser } from "@/features/auth";
```

Нарушение границы:

```ts
import { useAuth } from "@/features/auth/model/use-auth";
```

То же относится к относительному пути, который заходит в `ui/`, `model/` или `lib/` чужой фичи.

## Alias

Алиас объявляй на корень фичи. Есть `@/features/auth`. Нет `@/features/auth/ui` и нет `@/features/auth/model`.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/features/auth": ["src/features/auth/index.ts"]
    }
  }
}
```

Широкий `@/*` резолвит и внутренние файлы. Это не делает их публичными. Не добавляй отдельные `paths` на внутренние папки. Границу держит ESLint.

Подстановка `*` в TypeScript захватывает и слэши, поэтому путь вида `@/features/*` → `src/features/*/index.ts` не отрезает внутренние файлы. Ограничение «только корень» задаётся явным путём на `index.ts` и правилом ниже.

## ESLint

Запрети импорт из внутренних путей фичи. Официальный путь один: `@/features/<имя>`.

Шаблон `@/features/*/**` пропускает `@/features/<имя>` и запрещает импорт глубже корня (`@/features/auth/ui`, `@/features/auth/model/use-auth`). В flat config без `files` правило применяется только к JS, поэтому для TypeScript `files` нужен явно.

```js
// eslint.config.js
export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/features/*/**"],
          message: "Импортируй фичу только из публичного фасада: @/features/<name>.",
        }],
      }],
    },
  },
  {
    files: ["**/features/*/index.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "ExportAllDeclaration",
        message: "Фасад фичи перечисляет экспорты явно. export * запрещён.",
      }],
    },
  },
];
```

Если фичи импортируют друг друга относительными путями в обход алиаса, добавь своё правило с тем же контрактом: снаружи фичи разрешён только её фасад.

## Проверка

- У фичи одна точка входа, `index.ts`.
- В фасаде нет `export *`.
- Снаружи нет импортов во внутренние файлы.
- Алиас указывает на корень, не на `ui/`, `model/`, `lib/`.
- Тесты и сторибуки смотрят на публичный фасад, а не на внутренние файлы.
