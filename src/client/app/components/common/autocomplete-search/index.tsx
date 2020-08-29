import React, { useState, useRef, useCallback, useEffect } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type SuggestionResult<SuggestionData = any> = {
  id: string;
  data: SuggestionData;

  // This is used to insert a suggestion's text in the input
  // after a user enters/clicks on it.
  transformDataIntoText: (data: SuggestionData) => string;
};

export type onQueryReturnPromise<SuggestionData = any> = Promise<
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

export type NoSearchResultsComponent = (text: string) => JSX.Element;
export type QueryErrorComponent = (text: string) => JSX.Element;
export type MinCharsRequiredComponent = (text: string) => JSX.Element;
export type LoaderComponent = () => JSX.Element;

export type Props<SuggestionData> = {
  label: string;
  name?: string;
  autoFocus?: boolean;
  onQuery: (query: string) => onQueryReturnPromise<SuggestionData>;
  onQueryBecomesObsolete?: (queryPromise: onQueryReturnPromise) => void;
  onSubmit: () => void;
  debounceMs?: number;
  suggestionsLimit?: number;
  suggestionComponent?: SuggestionComponent<SuggestionData>;
  noResultsComponent?: NoSearchResultsComponent;
  noResultsMessage?: string; // TODO: when we are not fetching && min chars satisfied (derived from input) && suggestions.length === 0
  queryErrorComponent?: QueryErrorComponent;
  queryErrorMessage?: string;
  minCharsRequired?: number;
  minCharsRequiredComponent?: MinCharsRequiredComponent;
  minCharsRequiredMessage?: string;
  loaderComponent?: LoaderComponent;
  showLoader?: boolean; // supposed to be triggered in onSubmit
  blurOnSubmit?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AutoCompleteSearch<SuggestionData = any>({
  label,
  name = 'q',
  autoFocus = false,
  onQuery,
  onQueryBecomesObsolete,
  onSubmit,
  debounceMs = 150,
  suggestionsLimit = 7,
  noResultsMessage = 'There are no results for your query',
  queryErrorMessage = 'Fetch error occurred',
  minCharsRequired = 3,
  minCharsRequiredMessage = 'Start typing to see suggestions',
  blurOnSubmit = true,
}: Props<SuggestionData>): JSX.Element {
  const [inputVal, setInputVal] = useState('');
  const [debouncedInputVal, setDebouncedInputVal] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [suggestions, setSuggestions] = useState<
    SuggestionResult<SuggestionData>[]
  >([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    SuggestionResult<SuggestionData>['id'] | null
  >(null);
  const [isNavigatingSuggestions, setIsNavigatingSuggestions] = useState(false);
  const [showQueryError, setShowQueryError] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const currentQuery = useRef<onQueryReturnPromise | null>(null);
  const queryTimestamps = useRef(new Map<onQueryReturnPromise, number>());
  const latestResolvedQueryTimestamp = useRef(0);

  const performQuery = useCallback(
    function performQuery(query) {
      const disposableQuery = currentQuery.current;
      const queryPromise = onQuery(query);

      currentQuery.current = queryPromise;
      queryTimestamps.current.set(queryPromise, +new Date());

      if (disposableQuery && onQueryBecomesObsolete) {
        onQueryBecomesObsolete(disposableQuery);
      }

      function nullifyQueryPromise() {
        queryTimestamps.current.delete(queryPromise);

        // We don't want to nullify promises that come after the current.
        if (currentQuery.current === queryPromise) {
          currentQuery.current = null;
          setIsFetching(false);
        }
      }

      function maybeUpdateSuggestions(
        querySuggestions: SuggestionResult<SuggestionData>[]
      ) {
        const latestResolvedTs = latestResolvedQueryTimestamp.current;
        const queryPromiseTs = queryTimestamps.current.get(queryPromise);

        if ((queryPromiseTs as number) > latestResolvedTs) {
          latestResolvedQueryTimestamp.current = queryPromiseTs as number;

          setShowQueryError(false);
          setSuggestions(querySuggestions.slice(0, suggestionsLimit));

          // If a user already navigates suggestion results,
          // we set the selection on the first new suggestion.
          // If the list of suggestions is empty, we remove selection.
          // If the user doesn't navigate suggestion results (which means
          // user is typing in the input or left the field) we do nothing.
          if (isNavigatingSuggestions) {
            if (querySuggestions.length) {
              setSelectedSuggestionId(querySuggestions[0].id);
            } else {
              setSelectedSuggestionId(null);
              setIsNavigatingSuggestions(false);
            }
          }
        }
      }

      function maybeShowError() {
        // Show the error only if this is the latest query
        // set in flight. If there are other queries in flight
        // the better UX is to show previous results over the error.

        if (currentQuery.current === queryPromise) {
          setShowQueryError(true);
        }
      }

      queryPromise.then(
        function handleSuggestions(querySuggestions) {
          maybeUpdateSuggestions(querySuggestions);
          nullifyQueryPromise();
        },
        function handleQueryError() {
          maybeShowError();
          nullifyQueryPromise();
        }
      );
    },
    [onQuery, onQueryBecomesObsolete, suggestionsLimit, isNavigatingSuggestions]
  );

  const onChange = useCallback(function onChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setInputVal(e.currentTarget.value);
  },
  []);

  const onFormSubmit = useCallback(
    function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setIsFetching(false);
      onSubmit();

      if (blurOnSubmit) {
        inputRef.current?.blur();
      }
    },
    [onSubmit, blurOnSubmit]
  );

  useEffect(
    function debounceInputVal() {
      const timer = setTimeout(setDebouncedInputVal, debounceMs, inputVal);

      return function removeTimer() {
        clearTimeout(timer);
      };
    },
    [inputVal, debounceMs]
  );

  useEffect(
    function validateAndPerformQuery() {
      if (debouncedInputVal.trim().length >= minCharsRequired) {
        performQuery(debouncedInputVal);
      }
    },
    [debouncedInputVal, minCharsRequired, performQuery]
  );

  return (
    <form onSubmit={onFormSubmit}>
      <label>
        {label}
        <input
          ref={inputRef}
          name={name}
          value={inputVal}
          onChange={onChange}
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </label>
      {isFetching && <span>fetching suggestions</span>}
    </form>
  );
}
