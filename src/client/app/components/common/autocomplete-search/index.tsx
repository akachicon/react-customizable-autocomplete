import React, { useState, useRef, useCallback, useEffect } from 'react';
import useOnKeyDown from './lib/hooks/use-key-down';
import useSuggestionContainerContent from './lib/hooks/use-suggestion-container-content';
import type {
  AutocompleteSearchProps,
  SuggestionResult,
  OnQueryReturnPromise,
} from './lib/types/autocomplete-search-props';
import SuggestionDefaultComp from './suggestion';
import NoResultsDefaultComp from './no-search-results';
import QueryErrorDefaultComp from './query-error';
import MinCharsRequiredDefaultComp from './min-chars-required';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AutoCompleteSearch<SuggestionData = any>({
  label,
  name = 'q',
  onQuery,
  onQueryBecomesObsolete,
  onSubmit,
  debounceMs = 150,
  suggestionsLimit = 7,
  suggestionComponent = SuggestionDefaultComp,
  noResultsComponent = NoResultsDefaultComp,
  noResultsMessage = 'There are no results for your query',
  queryErrorComponent = QueryErrorDefaultComp,
  queryErrorMessage = 'Fetch error occurred',
  minCharsRequired = 3,
  minCharsRequiredComponent = MinCharsRequiredDefaultComp,
  minCharsRequiredMessage = 'Start typing to see suggestions',
  blurOnSubmit = true,
}: AutocompleteSearchProps<SuggestionData>): JSX.Element {
  const [inputVal, setInputVal] = useState('');
  const [perceivedInputVal, setPerceivedInputVal] = useState('');
  const [debouncedInputVal, setDebouncedInputVal] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [showContainer, setShowContainer] = useState(false);
  const [suggestions, setSuggestions] = useState<
    SuggestionResult<SuggestionData>[] | null
  >(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    SuggestionResult<SuggestionData>['id'] | null
  >(null);
  const [showQueryError, setShowQueryError] = useState(false);

  const input = useRef<HTMLInputElement | null>(null);
  const currentQuery = useRef<OnQueryReturnPromise | null>(null);
  const queryTimestamps = useRef(new Map<OnQueryReturnPromise, number>());
  const latestResolvedQueryTimestamp = useRef(0);
  const isNavigatingSuggestions = useRef(false);
  const boundSuggestionsExist = useRef(false);

  const debouncedInputValLength = debouncedInputVal.trim().length;
  const suggestionsExist = suggestions !== null;
  const suggestionsHaveLength = Boolean(suggestions?.length);

  boundSuggestionsExist.current = suggestionsExist;

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
    [onQuery, onQueryBecomesObsolete, suggestionsLimit]
  );

  const onKeyDown = useOnKeyDown({
    onQueryBecomesObsolete,
    suggestions,
    suggestionsHaveLength,
    selectedSuggestionId,
    inputVal,
    input,
    currentQuery,
    queryTimestamps,
    isNavigatingSuggestions,
    setSelectedSuggestionId,
    setPerceivedInputVal,
    setIsFetching,
  });

  const onChange = useCallback(function onChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    isNavigatingSuggestions.current = false;
    setSelectedSuggestionId(null);
    setInputVal(e.currentTarget.value);
    setPerceivedInputVal(e.currentTarget.value);
  },
  []);

  const onFocus = useCallback(function onFocus() {
    setShowContainer(true);
  }, []);

  const onBlur = useCallback(function onBlur() {
    setShowContainer(false);
  }, []);

  const onFormSubmit = useCallback(
    function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
      // TODO: passing selected suggestion
      e.preventDefault();
      onSubmit();

      if (blurOnSubmit) {
        input.current?.blur();
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
      if (debouncedInputValLength >= minCharsRequired) {
        performQuery(debouncedInputVal);
      } else if (boundSuggestionsExist.current) {
        // Consider the following scenario:
        // - a user already has some suggestions (maybe an empty list)
        // - the user removes input
        // - the user types letters again so that a new query is sent
        //    (min chars is passed)
        // For other parts of the code to detect the situation
        // when we should still render 'no results', though min chars
        // has been passed, we use setSuggestions(null). This also
        // applies to showQueryError.
        setSuggestions(null);
        setShowQueryError(false);
      }
    },
    [minCharsRequired, debouncedInputVal, debouncedInputValLength, performQuery]
  );

  const containerContent = useSuggestionContainerContent<SuggestionData>({
    minCharsRequired,
    minCharsRequiredMessage,
    minCharsRequiredComponent,
    queryErrorMessage,
    queryErrorComponent,
    suggestionComponent,
    noResultsMessage,
    noResultsComponent,
    suggestions,
    suggestionsExist,
    suggestionsHaveLength,
    selectedSuggestionId,
    showQueryError,
    debouncedInputValLength,
  });

  if (!suggestionsHaveLength && selectedSuggestionId !== null) {
    // TODO: consider removing isNavigating
    isNavigatingSuggestions.current = false;
    setSelectedSuggestionId(null);
  }

  return (
    <form onSubmit={onFormSubmit}>
      <label>
        {label}
        <input
          ref={input}
          name={name}
          value={perceivedInputVal}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
      </label>
      {isFetching && <span>fetching suggestions</span>}
      {showContainer && <div>{containerContent}</div>}
    </form>
  );
}
