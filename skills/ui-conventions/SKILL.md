---
name: ui-conventions
description: UI conventions for new interfaces. Do not set cursor:pointer on buttons; the hand cursor is a link convention. Use when styling buttons, links, or other clickable controls.
---

# UI-конвенции

## Кнопки без `cursor: pointer`

В новых проектах не ставь `cursor: pointer` на кнопки: элемент `<button>`, `role="button"` и компоненты-кнопки.

Курсор-рука — конвенция для ссылок. У ссылки другие ожидания, например открыть в новой вкладке. У кнопки и так явная форма. Обратную связь дают hover, focus и pressed.

Источник: Adam Silver, [Buttons shouldn't have a hand cursor](https://adamsilver.io/blog/buttons-shouldnt-have-a-hand-cursor/), 2016.

Ссылки (`<a href>`) курсор-руку оставляют: это указание, что цель — ссылка, а не кнопка.
