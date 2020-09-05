import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
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
import InputDefaultComp from './components/input';
import ContainerDefaultComp from './components/container';

const isDev = process?.env?.NODE_ENV === 'development';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AutoCompleteSearch<SuggestionData = any>({
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
  preserveInputOnSubmit = true,
  formProps,
  inputComponent: InputComponent = InputDefaultComp,
  containerComponent: ContainerDefaultComponent = ContainerDefaultComp,
}: AutocompleteSearchProps<SuggestionData>): JSX.Element {
  const [inputVal, setInputVal] = useState('');
  const [debouncedInputVal, setDebouncedInputVal] = useState('');
  const [perceivedInputVal, setPerceivedInputValProtected] = useState('');
  const [perceivedInputValTrigger, setPerceivedInputValTrigger] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [showContainer, setShowContainer] = useState(false);
  const [suggestions, setSuggestions] = useState<
    readonly SuggestionResult<SuggestionData>[] | null
  >(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    SuggestionResult<SuggestionData>['id'] | null
  >(null);
  const [showQueryError, setShowQueryError] = useState(false);

  const form = useRef<HTMLFormElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);

  const currentQuery = useRef<OnQueryReturnPromise<SuggestionData> | null>(
    null
  );
  const queryTimestamps = useRef(
    new Map<OnQueryReturnPromise<SuggestionData>, number>()
  );
  const latestResolvedQueryTimestamp = useRef(0);
  const obsoleteQueries = useRef<OnQueryReturnPromise<SuggestionData>[]>([]);

  const submissionLocker = useRef(new SubmissionLocker());
  const suggestionsExist = useRef(false);

  const boundPerceivedInputVal = useRef('');
  boundPerceivedInputVal.current = perceivedInputVal;

  const boundSuggestions = useRef<Readonly<
    SuggestionResult<SuggestionData>[]
  > | null>(null);
  boundSuggestions.current = suggestions;

  const debouncedInputValLength = debouncedInputVal.trim().length;
  suggestionsExist.current = suggestions !== null;

  const setPerceivedInputVal = useCallback(function setPerceivedInputVal(
    val: string
  ) {
    // Pass an object to run trigger.
    setPerceivedInputValTrigger({});
    setPerceivedInputValProtected(val);
  },
  []);

  const makeQueryObsolete = useCallback(
    function makeQueryObsolete(query: OnQueryReturnPromise<SuggestionData>) {
      obsoleteQueries.current.push(query);
      if (onQueryBecomesObsolete) {
        onQueryBecomesObsolete(query);
      }
    },
    [onQueryBecomesObsolete]
  );

  const hasLatestTimestamp = useCallback(function hasLatestTimestamp(
    queryPromise
  ) {
    const latestResolvedTs = latestResolvedQueryTimestamp.current;
    const queryPromiseTs = queryTimestamps.current.get(queryPromise);

    if (queryPromiseTs === undefined) {
      return undefined;
    }
    return queryPromiseTs > latestResolvedTs;
  },
  []);

  const performQuery = useCallback(
    function performQuery(query) {
      const disposableQuery = currentQuery.current;
      const queryPromise = onQuery(query);

      setIsFetching(true);
      currentQuery.current = queryPromise;
      queryTimestamps.current.set(queryPromise, +new Date());

      if (disposableQuery) {
        makeQueryObsolete(disposableQuery);
      }

      function getQueryTimestamp() {
        return queryTimestamps.current.get(queryPromise);
      }

      function nullifyQueryPromise() {
        queryTimestamps.current.delete(queryPromise);
        obsoleteQueries.current = obsoleteQueries.current.filter(
          (p) => p !== queryPromise
        );

        // We don't want to nullify promises that come after the current.
        if (currentQuery.current === queryPromise) {
          currentQuery.current = null;
          setIsFetching(false);
        }
      }

      function maybeUpdateSuggestions(
        querySuggestions: Readonly<SuggestionResult<SuggestionData>[]>
      ) {
        const hasLatestTs = hasLatestTimestamp(queryPromise);

        if (hasLatestTs) {
          latestResolvedQueryTimestamp.current = getQueryTimestamp() as number;

          setShowQueryError(false);
          setSuggestions(querySuggestions.slice(0, suggestionsLimit));
          setSelectedSuggestionId(null);
        }
      }

      function maybeShowError() {
        // Case: two queries are in flight, the second resolves with error.
        // After this, the first query resolves with data. To prevent showing
        // data irrelevant to the request and hiding error message, save the
        // timestamp.
        const hasLatestTs = hasLatestTimestamp(queryPromise);
        if (hasLatestTs) {
          latestResolvedQueryTimestamp.current = getQueryTimestamp() as number;
        }

        // Show the error only if this is the latest query
        // set in flight. If there are other queries in flight
        // the better UX is to show previous results over the error.

        if (currentQuery.current === queryPromise) {
          // The query will be obsolete when
          // - a query is on the flight (wrapping condition)
          // - the query was marked as obsolete with makeQueryObsolete
          // - the query was rejected in onQueryBecomesObsolete
          if (obsoleteQueries.current.includes(queryPromise)) {
            return;
          }
          setShowQueryError(true);
          setSelectedSuggestionId(null);
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
    [onQuery, suggestionsLimit, makeQueryObsolete, hasLatestTimestamp]
  );

  const disposeCurrentQuery = useCallback(
    function disposeCurrentQuery() {
      const queryInFlight = currentQuery.current;

      if (!queryInFlight) return;

      // The following two lines will exclude query promise
      // from handling.
      currentQuery.current = null;
      queryTimestamps.current.delete(queryInFlight);

      makeQueryObsolete(queryInFlight);
      setIsFetching(false);
    },
    [makeQueryObsolete]
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
    suggestions,
    selectedSuggestionId,
    inputVal,
    input,
    setPerceivedInputVal,
    attemptSubmit: onKeyDownSubmit,
    setSelectedSuggestionId: setSelectedIdWithKeyboard,
  });

  const onChange = useCallback(
    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
      // Block the field for the time of a submission.
      if (submissionLocker.current.isLocked) {
        e.preventDefault();
        return;
      }
      const value = e.currentTarget.value;

      if (value.trim().length < minCharsRequired) {
        disposeCurrentQuery();
      }
      submissionLocker.current.lastKeyboardSelectedId = null;
      setInputVal(value);
      setPerceivedInputVal(value);
    },
    [minCharsRequired, disposeCurrentQuery, setPerceivedInputVal]
  );

  const onFocus = useCallback(function onFocus() {
    setShowContainer(true);
  }, []);

  const onBlur = useCallback(function onBlur() {
    setShowContainer(false);
  }, []);

  const onFormSubmit = useCallback(
    function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      disposeCurrentQuery();

      const locker = submissionLocker.current;
      const id =
        locker.getLockInitiator() === 'keyboard'
          ? locker.lastKeyboardSelectedId
          : locker.lastPointerSelectedId;

      onSubmit(
        {
          id,
          query: boundPerceivedInputVal.current,
          suggestions: boundSuggestions.current,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          input: input.current!,
        },
        e
      );

      locker.release();
      locker.lastKeyboardSelectedId = null;
      locker.lastPointerSelectedId = null;

      setSuggestions(null);
      setSelectedSuggestionId(null);
      setInputVal('');
      setShowQueryError(false);
      queryTimestamps.current = new Map<OnQueryReturnPromise, number>();
      latestResolvedQueryTimestamp.current = 0;

      if (!preserveInputOnSubmit) {
        setPerceivedInputVal('');
      }
      input.current?.blur();
    },
    [onSubmit, preserveInputOnSubmit, disposeCurrentQuery, setPerceivedInputVal]
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

  const onMouseDownSubmit = useCallback(
    function onMouseDownSubmit(id: string) {
      const shouldContinue = submissionLocker.current.lock('pointer');
      if (shouldContinue) {
        const suggestions = boundSuggestions.current;
        const selectedSuggestion = suggestions?.find(
          ({ id: suggestionId }) => suggestionId === id
        );

        // Though pointer can only submit existing values,
        // we preserve the check for typescript.
        if (!selectedSuggestion) {
          submissionLocker.current.release();
          return;
        }

        setPerceivedInputVal(
          selectedSuggestion.transformDataIntoText(selectedSuggestion.data)
        );
      }
    },
    [setPerceivedInputVal]
  );

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

  const onContainerMouseLeave = useCallback(function onContainerMouseLeave() {
    submissionLocker.current.lastPointerSelectedId = null;
    setSelectedSuggestionId(null);
  }, []);

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
    [perceivedInputValTrigger]
  );

  const additionalFormProps = useMemo(
    function getFormArgs() {
      if (!formProps) {
        return {};
      }
      const { ref, onSubmit, ...allowedFormProps } = formProps;

      if (isDev && ref !== undefined) {
        throw new Error(
          '[autocomplete-search]: you cannot pass `ref` in `formProps`,' +
            'instead use allowed callback props'
        );
      }
      if (isDev && onSubmit !== undefined) {
        throw new Error(
          '[autocomplete-search]: you cannot pass `onSubmit` in `formProps`,' +
            'instead use `onSubmit` directly on the search component'
        );
      }
      return allowedFormProps;
    },
    [formProps]
  );

  const inputProps = useMemo(
    function inputProps() {
      return {
        ref: input,
        value: perceivedInputVal,
        onChange: onChange,
        onFocus: onFocus,
        onBlur: onBlur,
        onKeyDown: onKeyDown,
        autoComplete: 'off',
      };
    },
    [input, perceivedInputVal, onChange, onFocus, onBlur, onKeyDown]
  );

  const containerProps = useMemo(
    function inputProps() {
      return {
        onMouseLeave: onContainerMouseLeave,
      };
    },
    [onContainerMouseLeave]
  );

  if (selectedSuggestionId !== null && !suggestions?.length) {
    setSelectedSuggestionId(null);
  }

  return (
    <form ref={form} onSubmit={onFormSubmit} {...additionalFormProps}>
      <InputComponent inputProps={inputProps} isFetching={isFetching} />
      <ContainerDefaultComponent
        containerProps={containerProps}
        isFetching={isFetching}
        isOpen={showContainer}
      >
        {containerContent}
      </ContainerDefaultComponent>
    </form>
  );
}
