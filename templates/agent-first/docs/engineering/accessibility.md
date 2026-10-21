# UI accessibility и композиция интерактивных элементов

[Карта инженерной документации](../../CODING_STANDARDS.md).

Документ для правил, которые влияют на доступность, DOM-семантику и корректную композицию UI-компонентов.

## Содержание

- [Ошибки формы и focus targets](#ошибки-формы-и-focus-targets)
- [Асинхронная проверка и disabled-действия](#асинхронная-проверка-и-disabled-действия)
- [Tooltip и hint рядом с интерактивными элементами](#tooltip-и-hint-рядом-с-интерактивными-элементами)

## Ошибки формы и focus targets

Validation lifecycle и правила навигации после submit описаны в [forms.md](forms.md#фокус-после-отклонённого-submit). Здесь зафиксирован DOM/ARIA-контракт.

- Общий `focusFirstInvalidControl` / `useFocusFirstInvalidControl` и контракт `data-invalid-focus-target` живут в field-модуле дизайн-системы — один на проект.
- Ставьте `aria-invalid="true"` на фокусируемый value-owning контрол, которому действительно принадлежит ошибка.
- Связывайте контрол с сообщением через `aria-describedby` или механизм field-компонента React Aria.
- `role="alert"` используйте для самостоятельной динамической ошибки, после появления которой фокус остаётся на месте. Live-region не заменяет постоянную связь сообщения с контролом.
- Если после submit фокус сразу переносится на контрол с `aria-describedby`, отображайте связанную ошибку пассивно (компонент ошибки в режиме без live-region, например `StandaloneError isLive={false}`). Не объявляйте тот же текст одновременно как alert и как description: это может привести к повторному озвучиванию.
- Если значение редактируется через составной UI, помечайте реальную focusable recovery action условным `data-invalid-focus-target="true"` и связывайте её с ошибкой через `aria-describedby`.
- Не ставьте `aria-invalid` на action button только ради поиска: состояние не поддерживается ролью `button`. Технический `data-invalid-focus-target` также не заменяет ARIA-связь.
- `data-invalid-focus-target` существует только пока submit-ошибка актуальна. Disabled, скрытая или нефокусируемая цель не должна останавливать поиск.
- Создавайте `id` сообщения через `useId`, чтобы несколько экземпляров одного контрола не конфликтовали.

```tsx
const errorId = useId();

<Button
	data-invalid-focus-target={submitError ? "true" : undefined}
	aria-describedby={submitError ? errorId : undefined}
>
	Редактировать расписание
</Button>
<StandaloneError id={errorId} isLive={false}>
	{submitError}
</StandaloneError>
```

### Что проверять на ревью

- Невалидность размечена на контроле, а не на нефокусируемой обёртке.
- Составной контрол помечает focusable recovery action без ложного `aria-invalid` на кнопке.
- Ошибка имеет уникальный `id`, а контрол ссылается на неё.
- Ошибка, которая будет прочитана через `aria-describedby` после переноса фокуса, не дублируется через live-region.
- Disabled, скрытые и нефокусируемые элементы не объявлены активной focus-целью.

## Асинхронная проверка и disabled-действия

Когда блокировать переход/submit → [forms.md](forms.md#блокировка-действий-на-время-проверок). До реализации выберите состояние кнопки дизайн-системы:

| Причина                                                                           | Состояние       | Примеры                                                                          |
| --------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| Выполняется операция, от результата которой зависит действие                      | `isPending`     | Проверка ссылки/текста, сохранение, отправка                                     |
| Действие неприменимо в текущем контексте; ожидание само по себе ничего не изменит | `isDisabled`    | Нет выбранных строк для удаления; первая страница; достигнут лимит; режим чтения |
| Ошибки формы, проверки завершены                                                  | Submit доступен | Нажатие показывает ошибки                                                        |

- `isPending` блокирует активацию через `aria-disabled`, сохраняя фокусируемость. `isDisabled` выставляет нативный `disabled` и исключает кнопку из Tab-порядка, даже вместе с `isPending`. Для ожидания не добавляйте `isDisabled`; не показывайте pending без выполняющейся операции. [React Aria](https://react-aria.adobe.com/Button), [WAI-APG](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols).
- Оставляйте кнопку на месте, сохраняйте фокус; фоновые проверки не переводят его автоматически. Неочевидную причину недоступности объясняйте рядом, без необходимости наводить на disabled-кнопку.
- Сам по себе `aria-disabled` не блокирует события: используйте штатный контракт кнопки и защиту обработчика формы.
- Показывайте текст ожидания рядом с полем/действием. Начало и результат проверки объявляйте через заранее смонтированный `role="status"` с `aria-atomic="true"` или эквивалентный механизм компонента, без дублирования и `role="alert"`. Одного спиннера или исчезновения текста недостаточно; завершение не означает отсутствие ошибок. [WCAG 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22).

## Tooltip и hint рядом с интерактивными элементами

Имена компонентов ниже — роли в дизайн-системе; замените на свои. `Hint` — это focusable informer: внутри него используется React Aria `Focusable`, `TooltipTrigger` и `span role="img"`.
Поэтому `Hint` нельзя вкладывать внутрь другого интерактивного элемента или кликабельного label.

### Обязательное правило

Не рендерить `Hint` внутри `button`, `a`, `Radio`, `ToggleButton`, trigger селекта, menu item и других элементов, которые сами являются интерактивными.

`stopPropagation`, `span`-обёртка или CSS не делают такую вложенность корректной: в DOM всё равно появляется focusable trigger внутри другого интерактивного элемента.

```tsx
// Нельзя
<ToggleButton id="business">
	<span className="flex items-center gap-2">
		Бизнес
		<Hint text="Подсказка" />
	</span>
</ToggleButton>
```

```tsx
// Можно для взаимоисключающего выбора: hint уровня всей группы через публичный API
<SegmentedControl label="Тип аккаунта" hint="Подсказка" value={accountType} onChange={setAccountType}>
	<SegmentedControlItem value="business">Бизнес</SegmentedControlItem>
	<SegmentedControlItem value="performer">Исполнитель</SegmentedControlItem>
</SegmentedControl>
```

### Рабочие паттерны

- Используйте `HintSlot` только там, где его типизированный `placement` полностью задаёт геометрию: общий `relative`-контейнер, сам control отдельно, `Hint` рядом абсолютным слоем. Не завершайте контракт произвольными внутренними отступами control и координатами/выравниванием slot в consumer-коде.
- Для hint внутри отдельного item `ToggleButtonGroup` готового типизированного API сейчас нет. Если hint относится ко всей группе и выбор взаимоисключающий, используйте `hint` у семантически подходящего `SegmentedControl`; в остальных случаях размещайте hint рядом с неинтерактивным label группы. Если нужен именно per-item inset hint, сначала добавьте в UI-компонент явный reusable prop/variant; не имитируйте его через `pr-*` на `ToggleButton` и ad-hoc `className` на `HintSlot`.
- Если absolute-слой шире самой иконки, ставьте `pointer-events-none` на слой и `pointer-events-auto` только на wrapper вокруг `Hint`, чтобы не блокировать клики по control.
- Для label полей с иконкой подсказки используйте `LabelRow` или проп `hint` у field-компонентов (`TextField`, `Select` и т.д.): `Label` и `Hint` — siblings, не вложенность.
- Для radio/checkbox label кладите `Radio` и `Hint` соседями в общий layout-контейнер. Внутри `Radio` должен оставаться только label самого radio.
- Для number field используйте `HintSlot`, чтобы hint был рядом с input, но не внутри интерактивного root.
- **`relative`-контейнер должен оборачивать только строку control (trigger/input), а не весь field** (label, description, popover). Иначе `absolute` hint «улетит» от trigger.
- Для `Select`, `PickerTag` и `ComboBox`: RAC `<Label>` остаётся **внутри** соответствующего Aria-компонента; `Hint` и `labelExtra` размещаются **снаружи** через `LabelExternalAccessories`. Обёртка задаёт `relative`, а `LabelExternalHintAnchor` ставит hint рядом с текстом label. Tooltip-trigger внутри Select/trigger ломает runtime — под trigger hint не класть.
- Для `PickerTagSearch`: `LabelRow` (label и hint — siblings). Это не Select, hint не через `LabelExternalHintAnchor`.
- Async-выдача в `PickerTagSearch`: search input остаётся смонтированным во всех состояниях, loading помечается `aria-busy` на обновляемом region, а loading / количество результатов / пустая выдача / ошибка объявляются одним всегда смонтированным `role="status"`. Инструкция пустого запроса — `aria-describedby` инпута, не live region. Текст пустой выдачи задаётся `emptyResultsMessage` и совпадает с объявлением; `renderEmptyState` — только для разметки. Ошибка загрузки списка идёт в `loadError` с `onRetry`; `errorMessage` остаётся валидацией значения.
- Для tooltip над обычным интерактивным trigger используйте `Tooltip` вокруг React Aria pressable-компонента.
- Для disabled/status cases не добавляйте общий UI-kit wrapper для произвольного содержимого. Если нужен focusable fallback, делайте локальный или узко переиспользуемый wrapper под конкретный disabled-control паттерн с явной ролью trigger.
- Для обрезанного plain text используйте `TruncatedText`: это visual overflow tooltip без `role="button"` и `tabIndex`.

### Что проверять на ревью

- `Hint` не находится в JSX-children у `ToggleButton`, `Radio`, `Button`, `Link`, `a`, `Select` trigger или другого pressable/control.
- Если дизайн выглядит как “иконка внутри кнопки/поля”, в DOM control и `Hint` всё равно должны быть siblings.
- Storybook-примеры не должны показывать запрещённую вложенность как валидный паттерн.
