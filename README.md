# `<autocomplete-input>`

This custom element implements an autocomplete (aka combobox) input as a form associated custom element. As a form associated element, it will "quack" just like a real input when added to form: it will use its name attribute to populate the FormData of it's surrounding form element.

## Motivation

Existing solutions generally expect to manage and filter their own list of options, which is problematic for applications that wish to manage this process from outside the element (eg server side).

This element does *not* fetch its own list of elements or do filtering based on the input value. Instead, it relies on the surrounding application to provide the current set of options and emits events based on user interaction. This makes it a good fit with event oriented backends such as [LiveView](https://hexdocs.pm/phoenix_live_view/1.0.0-rc.0/Phoenix.LiveView.html) or [LiveState](https://github.com/launchscout/live_state).

The intended usage pattern for this element is to handle the events dispatched by this element(see below), use the data in said events to obtain the current list of items, and populate the list of items as inner content in the `list` slot (see below).

## Installation

```
npm install @launchscout/autocomplete-input
```

## Providing options

The `items` attribute should contain a json string of option project. The `label-property` and `value-property` will be used to extract the label and value for each item.

## Events

- `autocomplete-search` sent when the value of the input changes and is greater than the `minlength`, debounced by the specified interval.
- `autocomplete-commit` sent when an item is selected either by pressing Enter or clicking an option
- `autocomplete-close` sent when the element is open and loses focus, on by user pressing Escape

## Attributes

- `name` This is a required attribute for setting the correct FormData value. It works exactly the same way as the `name` attribute of any other form input.
- `clear-list-on-select` If true, will cause the options list to have it's children removed when an `autocomplete-commit` event is about to be dispatched.
- `debounce` The time in milliseconds to debounce before sending an `autocomplete-search` event when the user enters text into the input
- `value` The value which will be initially used to populate the `FormData` of the associated form.
- `searchValue` The value which will initially be used to populate the search input.
- `open` The element will start in the Open mode display the text input
- `label-property` The property of each item that will be used as the displayed label, defaults to `name`
- `value-property` The property of each item that will be used as the displayed label, defaults to `id`

## Parts

The following parts are available for styling using [part selectors]([text](https://developer.mozilla.org/en-US/docs/Web/CSS/::part))

- `list` The list of options, only displayed if the autocomplete is open
- `option` All of the option `li` elements will have this part assigned
- `selected-option` This is the option currently focused by keyboard navigation

## Example

See the [autocomplete_testbed](https://github.com/launchscout/autocomplete_testbed) project for an example of using this component with Phoenix LiveView.

## Credits

The excellent [@github/combobox-nav](https://github.com/github/combobox-nav) provides the functionality to navigate and select from the list of options.