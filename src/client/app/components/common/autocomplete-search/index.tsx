import React, { useState, useRef, useCallback, useEffect } from 'react';
import useOnKeyDown from './hooks/use-key-down';
import useSuggestionContainerContent from './hooks/use-suggestion-container-content';
import type {
  AutocompleteSearchProps,
  SuggestionResult,
  OnQueryReturnPromise,
} from './types/autocomplete-search-props';
import SubmissionLocker from './lib/submission-locker';
import SuggestionDefaultComp from './components/suggestion';
import NoResultsDefaultComp from './components/no-search-results';
import QueryErrorDefaultComp from './components/query-error';
import MinCharsRequiredDefaultComp from './components/min-chars-required';

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
  const [suggestions, setSuggestions] = useState<Readonly<
    SuggestionResult<SuggestionData>[]
  > | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    SuggestionResult<SuggestionData>['id'] | null
  >(null);
  const [showQueryError, setShowQueryError] = useState(false);

  const form = useRef<HTMLFormElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const currentQuery = useRef<OnQueryReturnPromise | null>(null);
  const queryTimestamps = useRef(new Map<OnQueryReturnPromise, number>());
  const latestResolvedQueryTimestamp = useRef(0);
  const submissionLocker = useRef(new SubmissionLocker());
  const suggestionsExist = useRef(false);

  const debouncedInputValLength = debouncedInputVal.trim().length;
  suggestionsExist.current = suggestions !== null;

  const performQuery = useCallback(
    function performQuery(query) {
      // TODO: encapsulate query logic
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
        querySuggestions: Readonly<SuggestionResult<SuggestionData>[]>
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

  const onKeyDownSubmit = useCallback(function onKeyDownSubmit() {
    const shouldContinue = submissionLocker.current.lock('keyboard');
    if (shouldContinue) {
      form.current?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: false })
      );
    }
  }, []);

  const setSelectedIdWithKeyboard = useCallback(
    function setSelectedIdWithKeyboard(id: string | null) {
      submissionLocker.current.lastKeyboardSelectedId = id;
      setSelectedSuggestionId(id);
    },
    []
  );

  const onKeyDown = useOnKeyDown({
    onQueryBecomesObsolete,
    suggestions,
    selectedSuggestionId,
    inputVal,
    input,
    currentQuery,
    queryTimestamps,
    setPerceivedInputVal,
    setIsFetching,
    attemptSubmit: onKeyDownSubmit,
    setSelectedSuggestionId: setSelectedIdWithKeyboard,
  });

  const onChange = useCallback(function onChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    // Block the field for the time of a submission.
    if (submissionLocker.current.isLocked) {
      e.preventDefault();
      return;
    }
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
      e.preventDefault();

      console.log('key id:', submissionLocker.current.lastKeyboardSelectedId);
      console.log(
        'pointer id:',
        submissionLocker.current.lastKeyboardSelectedId
      );

      submissionLocker.current.release();

      // TODO: passing selected suggestion
      onSubmit();

      if (blurOnSubmit) {
        // TODO: consider removing or moving to onclick only since enter does it by default
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
      } else if (suggestionsExist.current) {
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

  const onMouseDownSubmit = useCallback(function onMouseDownSubmit(id: string) {
    const shouldContinue = submissionLocker.current.lock('pointer');
    if (shouldContinue) {
      setPerceivedInputVal(`suggestion id: ${id}`);
    }
  }, []);

  const setSelectedIdWithPointer = useCallback(
    function setSelectedIdWithPointer(id: string | null) {
      submissionLocker.current.lastPointerSelectedId = id;
      setSelectedSuggestionId(id);
    },
    []
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
    selectedSuggestionId,
    showQueryError,
    debouncedInputValLength,
    attemptSubmit: onMouseDownSubmit,
    setSelectedSuggestionId: setSelectedIdWithPointer,
  });

  useEffect(
    function onPointerSubmission() {
      if (
        submissionLocker.current.isLocked &&
        submissionLocker.current.getLockInitiator() === 'pointer'
      ) {
        form.current?.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: false })
        );
      }
    },
    [perceivedInputVal]
  );

  if (selectedSuggestionId !== null && !suggestions?.length) {
    setSelectedSuggestionId(null);
  }

  return (
    <form ref={form} onSubmit={onFormSubmit}>
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
