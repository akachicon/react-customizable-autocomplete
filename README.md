# react-customizable-autocomplete
A library to create search with autocomplete. [Demo](https://akachicon.github.io/react-customizable-autocomplete).

## Requirements
This package requires ```Promise``` to be available globally, it is not bundled as 
it's very much likely you already have one.

## Features
- Handles all the state changes regarding user input, you just fill the components
- Css solution of your choice
- Allows for WAI-ARIA compliant [implementation](https://codesandbox.io/s/accessible-search-9yy2f)
- Provides a callback to cancel queries as soon as they become obsolete
- Allows customization of any part of the component
- Allows configuring characters number required to start querying 
- Allows configuring debounce step
- Typescript support 

## Bundle
This library comes in three flavours: ejs, cjs and umd. Ejs and cjs bundles require
necessary modules in their code, while the umd bundles all the modules. As a result, 
unpacked ejs/cjs bundle will add to your project from 11kb to 32kb (3.5kb to 12kb 
gzipped, depending on how much polyfills you already use), and the umd size will 
add 32kb (12kb gzipped). All bundles can be found in ```dist``` directory. 

## Usage
### Installation
```shell script
npm install react-customizable-autocomplete
```
or
```shell script
yarn add react-customizable-autocomplete
```
If you want to use umd build:
```html
<script src="https://unpkg.com/react-customizable-autocomplete/dist/index.umd.min.js"></script>
<!-- The library is available under ReactCustomizableAutocomplete name -->
```

### Examples
- [accessible-search-js](https://codesandbox.io/s/accessible-search-9yy2f)
- [accessible-search-ts](https://codesandbox.io/s/accessible-search-ts-zpvx8)

### Props
#### `onQuery`: `(query) => Promise<{ id, text, data? }[]>`
Is called every time the autocomplete needs more data. Should return a promise 
which resolves to an array of objects with at least two fields: `id` and `text`.
The resolved array will be passed partially or as a whole to other props.
If the promise of the last `onQuery` is rejected, `errorComponent` will be rendered.
If the reject happens after submission, or when the required number of characters 
is not enough to fulfill `minCharsRequired`, then `errorComponent` won't be rendered.

- `query: string` - the input for which `onQuery` is called.  

- `id: string` - used internally for managing suggestions. 

- `text: string` - placed in the input while user navigates with a keyboard. 

- `data?: any` - a place to store additional information about a suggestion so that we 
could render custom suggestion components (e.g. text with an image).   

#### `onQueryBecomesObsolete?`: `(onQueryResult) => void`
Is called right after the last `onQuery` was issued with the previous `onQuery` 
result. During the execution of `onQueryBecomesObsolete` callback it's safe to 
reject the promise: `errorComponent` won't be shown to the user.

#### `onSubmit: ({ query, id, suggestions, resetInput }, formEvent) => void`
Is called when the user submits the form.

- `query: string` - the input that user submits.

- `id: string | null` - if the user submits by selection of one of the suggestions, the corresponding id 
from `onQuery` result will be passed, otherwise `null`.

- `suggestions` - the `onQuery` result. E.g. if the query matches the first suggestion you might 
want to redirect user to the suggestion page directly. 

- `resetInput: () => void` - a callback that cleans the input. It allows cleaning input *after* additional 
submission request, e.g. after the user submits specific suggestion, you fetch 
page result and only then clean the input.

- `formEvent` - the original React form submit event. 

#### `formProps?`
Additional props to be passed to the `form` element. The only two forbidden 
props are `ref` and `onSubmit`. In development mode these two props will throw 
when passed, in production they will be ignored. Use the component `onSubmit` 
and form callbacks to handle the task.

#### `debounceMs?: number = 150`
The delay used by debounce function.

#### `minCharsRequired?: number = 3`;
The number of chars user needs to type for `onQuery` to be called.

#### `inputComponent`
A component that will be rendered in the form and should contain the input field.
It will be passed following props:

- `inputProps` - the object containing input props that should be applied directly on the input 
element. It contains the following fields:
`value` `onChange` `onFocus` `onBlur` `onKeyDown` `autoComplete` `ref`.

- `selectedItem` - an item from `onQuery` result array, which is currently selected.

- `isFetching: boolean` - a flag indicating that the autocomplete is fetching. NOTE: For 
better ux, it is also `true` if there *will* be a request, i.e. after the user started to 
type but before the request sent.

- `isOpen: boolean` - whether the list is shown or not.

- `submit: () => void` - a callback to trigger submit.

- `reset: () => void` - a callback reset to user input.

#### `listContainerComponent`
A component that will be rendered in the form and contains all other components 
except `inputComponent`.
It will be passed following props:

- `containerProps` - the object containing props that should be applied directly on the container 
element. It contains the following fields:
`onMouseLeave`.

- `selectedItem` - same as in `inputComponent`.

- `isFetching: boolean` - same as in `inputComponent`.

- `isOpen: boolean` - same as in `inputComponent`.

- `submit: () => void` - same as in `inputComponent`.

#### `listComponent`
A component holding the suggestions. Renders inside `listContainerComponent`.
Will be passed the following:

- `suggestions` - suggestions array from `onQuery`.

- `selectedId` - an id of the currently selected suggestion.

- `suggestionHandlers: { onMouseDown: (id) => void, onMouseOver: (id) => void }` - these handlers should be called with an id of the suggestion whenever the item's 
original `onMouseDown` and `onMouseOver` are called.

#### `minCharsComponent`
The component to render when there is not enough chars to satisfy `minCharsRequired`.
Renders inside `listContainerComponent`.

#### `noResultsComponent`
The component to render when `onQuery` yields an empty array. Renders inside 
`listContainerComponent`.

#### `errorComponent`
The component to render when the last `onQuery` result is rejected. 
If the reject happens after submission, or when the required number of characters 
is not enough to fulfill `minCharsRequired`, then `errorComponent` won't be rendered.
Renders inside `listContainerComponent`.
