/* eslint-disable @typescript-eslint/no-explicit-any */
export type SuggestionResult<SuggestionData = any> = {
  id: string;
  data: SuggestionData;

  // This is used to insert a suggestion's text in the input
  // after a user enters/clicks on it.
  transformDataIntoText: (data: SuggestionData) => string;
};

export type OnQueryReturnPromise<SuggestionData = any> = Promise<
  SuggestionResult<SuggestionData>[]
>;

export type SuggestionComponentProps<SuggestionData = any> = {
  selected: boolean;
  data: SuggestionData;
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

export type LoaderComponent = () => JSX.Element;

export type AutocompleteSearchProps<SuggestionData> = {
  label: string;
  name?: string;
  onQuery: (query: string) => OnQueryReturnPromise<SuggestionData>;
  onQueryBecomesObsolete?: (queryPromise: OnQueryReturnPromise) => void;
  onSubmit: () => void;
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
  loaderComponent?: LoaderComponent;
  showLoader?: boolean;
  blurOnSubmit?: boolean;
};
