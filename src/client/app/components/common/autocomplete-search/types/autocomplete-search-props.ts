import React, {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type SuggestionResult<SuggestionData = any> = Readonly<{
  id: string;
  data: SuggestionData;
  text: string;

  // This is used to insert a suggestion's text in the input
  // after a user enters/clicks on it.
  transformDataIntoText: (data: SuggestionData) => string;
}>;

export type OnQueryReturnPromise<SuggestionData = any> = Promise<
  readonly SuggestionResult<SuggestionData>[]
>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type OnSubmitParam<SuggestionData = any> = Readonly<{
  id: string | null;
  query: string;
  suggestions: readonly SuggestionResult<SuggestionData>[] | null;
}>;

export type OnSubmitHandler<SuggestionData = unknown> = (
  arg: OnSubmitParam<SuggestionData>,
  event: React.FormEvent<HTMLFormElement>
) => void;

// It is guaranteed by convention that the consumer will
// set autocomplete-search data attr on the component
// root element. This type supposed to be used e.g. in
// onMouseOver, onClick handlers as a generic arg to
// React.MouseEvent (React.MouseEvent<SuggestionHTMLElement>).
export type SuggestionHTMLElement = Element & {
  dataset: {
    autocompleteSearch: string;
  };
};

export type SuggestionComponentProps<SuggestionData = any> = {
  id: string;
  selected: boolean;
  data: SuggestionData;

  // We do not specify suggestionHTMLElement generic arg as it
  // will cause conflicts. E.g. div inside the component won't
  // accept onClick handler cause the div has no
  // .dataset.autocompleteSearch: string.
  onMouseOver: React.MouseEventHandler;
  onMouseDown: React.MouseEventHandler;
};

export type SuggestionComponent<SuggestionData = any> = (
  props: SuggestionComponentProps<SuggestionData>
) => JSX.Element;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type NoSearchResultsComponent = (props: { text: string }) => JSX.Element;

export type QueryErrorComponent = (props: { text: string }) => JSX.Element;

export type MinCharsRequiredComponent = (props: {
  text: string;
}) => JSX.Element;

export type InputComponentProps = {
  inputProps: JSX.IntrinsicElements['input'];
  isFetching: boolean;
};

export type InputComponentFunction = React.ForwardRefRenderFunction<
  HTMLInputElement,
  InputComponentProps
>;

export type InputComponent = ForwardRefExoticComponent<
  PropsWithoutRef<InputComponentProps> & RefAttributes<HTMLInputElement>
>;

export type ContainerComponentProps = {
  containerProps: {
    onMouseLeave: React.MouseEventHandler;
  };
  isFetching: boolean;
  isOpen: boolean;
  children: JSX.Element | JSX.Element[];
};

export type ContainerComponent = (
  props: ContainerComponentProps
) => JSX.Element;

export type AutocompleteSearchProps<SuggestionData = unknown> = {
  label: string;
  name?: string;
  onQuery: (query: string) => OnQueryReturnPromise<SuggestionData>;
  onQueryBecomesObsolete?: (queryPromise: OnQueryReturnPromise) => void;
  onSubmit: OnSubmitHandler<SuggestionData>;
  debounceMs?: number;
  suggestionsLimit?: number;
  suggestionComponent?: SuggestionComponent<SuggestionData>;
  noResultsComponent?: NoSearchResultsComponent;
  noResultsMessage?: string;
  queryErrorComponent?: QueryErrorComponent;
  queryErrorMessage?: string;
  minCharsRequired?: number;
  minCharsRequiredComponent?: MinCharsRequiredComponent;
  minCharsRequiredMessage?: string;
  preserveInputOnSubmit?: boolean;
  formProps?: JSX.IntrinsicElements['form'];
  inputComponent?: InputComponent;
  containerComponent?: ContainerComponent;
};
