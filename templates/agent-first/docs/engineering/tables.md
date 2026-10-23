# Таблицы

[Карта инженерной документации](../../CODING_STANDARDS.md).

Апп-контракт: какой компонент брать и чего не строить в фиче. API компонента — рядом с ним, не здесь.

<!-- Ссылки на README и stories компонентов: «- `DataTable` → [README](packages/ui/src/data-table/README.md), Storybook `UI/DataTable`». -->

## Содержание

- [Правила](#правила)
- [Review: стабильность selection](#review-стабильность-selection)
- [Browser verification](#browser-verification)

## Правила

- Интерактивная таблица (sort, filter, selection, resize, column manager) — всегда один компонент дизайн-системы (`DataTable`).
- Табличные примитивы (`Table`) — только статичная разметка (сводки, detail) и chrome вокруг `DataTable` (скелетон, border, bulk-тулбар).
- В `src` нет своей table-инфраструктуры: без `src/tables`, без общего namespace переводов `Tables`. Колонки, cell-компоненты и переводы живут в фиче-владельце.
- Табличный kernel (TanStack Table и аналоги) в приложении не импортируется. Второй kernel или ручная сборка чекбоксов выбора не допускаются.
- `data`, `columns`, `getRowId` и `canSelectRow` — стабильные ссылки ([react.md](react.md#компоненты-react)).
- Always-mounted drawer/modal с таблицей внутри не должен гонять нестабильный `data` на каждый render родителя, пока он закрыт.
- Cross-page selection, lock и bulk payload — домен родителя (выбранные id, кэш строк, `selectedCount`, `onClearSelection`).

## Review: стабильность selection

Если diff затрагивает таблицу, selection, агрегацию данных из нескольких запросов или drawer/modal вокруг таблицы:

- новый массив из `queries.flatMap(...)` в render — нестабильный `data`;
- derived `selectedIds` или объект selection в deps другого `useMemo`/`useCallback`/context требует стабильную ссылку или regression-test на стабильность;
- подозрение на render loop — минимум 🟠, даже если checks зелёные.

## Browser verification

После cross-cutting изменения контракта таблиц проверьте в браузере потребителей высокого риска:

- данные загружаются без runtime/console errors, и empty state не маскирует ошибку;
- sorting, filtering и pagination меняют строки ожидаемо, если таблица их поддерживает;
- column visibility, order и resize работают и сохраняются после reload, если таблица поддерживает persistence;
- row selection, select-all и toolbar реактивно обновляются и корректно очищаются;
- server-side и local таблица используют свой pagination mode.

Достаточно минимального набора страниц, покрывающего каждую изменённую возможность таблицы; открывать каждую таблицу с тем же wiring не нужно. Запуск и cleanup — в [browser-testing.md](browser-testing.md).
