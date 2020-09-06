import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import usePerformQuery from './hooks/use-perform-query';
import useOnSubmit from './hooks/use-submit';
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
  const [inputVal, setInputValSt] = useState('');
  const [debouncedInputVal, setDebouncedInputValSt] = useState('');
  const [perceivedInputVal, setPerceivedInputValSt] = useState('');
  const [perceivedInputValTrigger, setPerceivedInputValTriggerSt] = useState(
    {}
  );
  const [isFetching, setIsFetchingSt] = useState(false);
  const [showContainer, setShowContainerSt] = useState(false);
  const [suggestions, setSuggestionsSt] = useState<
    readonly SuggestionResult<SuggestionData>[] | null
  >(null);
  const [selectedSuggestionId, setSelectedSuggestionIdSt] = useState<
    SuggestionResult<SuggestionData>['id'] | null
  >(null);
  const [showQueryError, setShowQueryErrorSt] = useState(false);

  const formRf = useRef<HTMLFormElement | null>(null);
  const inputRf = useRef<HTMLInputElement | null>(null);

  const currentQueryRf = useRef<OnQueryReturnPromise<SuggestionData> | null>(
    null
  );
  const queryTimestampsRf = useRef(
    new Map<OnQueryReturnPromise<SuggestionData>, number>()
  );
  const latestResolvedQueryTimestampRf = useRef(0);
  const obsoleteQueriesRf = useRef<OnQueryReturnPromise<SuggestionData>[]>([]);

  const submissionLockerRf = useRef(new SubmissionLocker());
  const suggestionsExistRf = useRef(false);

  const perceivedInputValRf = useRef('');
  perceivedInputValRf.current = perceivedInputVal;

  const suggestionsRf = useRef<Readonly<
    SuggestionResult<SuggestionData>[]
  > | null>(null);
  suggestionsRf.current = suggestions;

  const debouncedInputValLength = debouncedInputVal.trim().length;
  suggestionsExistRf.current = suggestions !== null;

  const setPerceivedInputVal = useCallback(function setPerceivedInputVal(
    val: string
  ) {
    // Pass an object to run trigger.
    setPerceivedInputValTriggerSt({});
    setPerceivedInputValSt(val);
  },
  []);

  const makeQueryObsolete = useCallback(
    function makeQueryObsolete(query: OnQueryReturnPromise<SuggestionData>) {
      obsoleteQueriesRf.current.push(query);
      if (onQueryBecomesObsolete) {
        onQueryBecomesObsolete(query);
      }
    },
    [onQueryBecomesObsolete]
  );

  const hasLatestTimestamp = useCallback(function hasLatestTimestamp(
    queryPromise: OnQueryReturnPromise<SuggestionData>
  ) {
    const latestResolvedTs = latestResolvedQueryTimestampRf.current;
    const queryPromiseTs = queryTimestampsRf.current.get(queryPromise);

    if (queryPromiseTs === undefined) {
      return undefined;
    }
    return queryPromiseTs > latestResolvedTs;
  },
  []);

  const performQuery = usePerformQuery<SuggestionData>({
    currentQueryRf,
    obsoleteQueriesRf,
    queryTimestampsRf,
    latestResolvedQueryTimestampRf,
    setSuggestionsSt,
    setSelectedSuggestionIdSt,
    setIsFetchingSt,
    setShowQueryErrorSt,
    hasLatestTimestamp,
    makeQueryObsolete,
    suggestionsLimit,
    onQuery,
  });

  const disposeCurrentQuery = useCallback(
    function disposeCurrentQuery() {
      const queryInFlight = currentQueryRf.current;

      if (!queryInFlight) return;

      // The following two lines will exclude query promise
      // from handling.
      currentQueryRf.current = null;
      queryTimestampsRf.current.delete(queryInFlight);

      makeQueryObsolete(queryInFlight);
      setIsFetchingSt(false);
    },
    [makeQueryObsolete]
  );

  const onKeyDownSubmit = useCallback(function onKeyDownSubmit() {
    const shouldContinue = submissionLockerRf.current.lock('keyboard');
    if (shouldContinue) {
      formRf.current?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: false })
      );
    }
  }, []);

  const setSelectedIdWithKeyboard = useCallback(
    function setSelectedIdWithKeyboard(id: string | null) {
      submissionLockerRf.current.lastKeyboardSelectedId = id;
      setSelectedSuggestionIdSt(id);
    },
    []
  );

  const onKeyDown = useOnKeyDown({
    suggestions,
    selectedSuggestionId,
    inputVal,
    setPerceivedInputVal,
    inputRf,
    attemptSubmit: onKeyDownSubmit,
    setSelectedSuggestionId: setSelectedIdWithKeyboard,
  });

  const onChange = useCallback(
    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
      // Block the field for the time of a submission.
      if (submissionLockerRf.current.isLocked) {
        e.preventDefault();
        return;
      }
      const value = e.currentTarget.value;

      if (value.trim().length < minCharsRequired) {
        disposeCurrentQuery();
      }
      submissionLockerRf.current.lastKeyboardSelectedId = null;
      setInputValSt(value);
      setPerceivedInputVal(value);
    },
    [minCharsRequired, disposeCurrentQuery, setPerceivedInputVal]
  );

  const onFocus = useCallback(function onFocus() {
    setShowContainerSt(true);
  }, []);

  const onBlur = useCallback(function onBlur() {
    setShowContainerSt(false);
  }, []);

  const onFormSubmit = useOnSubmit({
    submissionLockerRf,
    perceivedInputValRf,
    suggestionsRf,
    inputRf,
    queryTimestampsRf,
    latestResolvedQueryTimestampRf,
    setSuggestionsSt,
    setSelectedSuggestionIdSt,
    setInputValSt,
    setShowQueryErrorSt,
    onSubmit,
    preserveInputOnSubmit,
    disposeCurrentQuery,
    setPerceivedInputVal,
  });

  useEffect(
    function debounceInputVal() {
      const timer = setTimeout(setDebouncedInputValSt, debounceMs, inputVal);

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
      } else if (suggestionsExistRf.current) {
        // Consider the following scenario:
        // - a user already has some suggestions (maybe an empty list)
        // - the user removes input
        // - the user types letters again so that a new query is sent
        //    (min chars is passed)
        // For other parts of the code to detect the situation
        // when we should still render 'no results', though min chars
        // has been passed, we use setSuggestionsSt(null). This also
        // applies to showQueryError.
        setSuggestionsSt(null);
        setShowQueryErrorSt(false);
      }
    },
    [minCharsRequired, debouncedInputVal, debouncedInputValLength, performQuery]
  );

  const onMouseDownSubmit = useCallback(
    function onMouseDownSubmit(id: string) {
      const shouldContinue = submissionLockerRf.current.lock('pointer');
      if (shouldContinue) {
        const suggestions = suggestionsRf.current;
        const selectedSuggestion = suggestions?.find(
          ({ id: suggestionId }) => suggestionId === id
        );

        // Though pointer can only submit existing values,
        // we preserve the check for typescript.
        if (!selectedSuggestion) {
          submissionLockerRf.current.release();
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
      submissionLockerRf.current.lastPointerSelectedId = id;
      setSelectedSuggestionIdSt(id);
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
    submissionLockerRf.current.lastPointerSelectedId = null;
    setSelectedSuggestionIdSt(null);
  }, []);

  useEffect(
    function onPointerSubmission() {
      if (
        submissionLockerRf.current.isLocked &&
        submissionLockerRf.current.getLockInitiator() === 'pointer'
      ) {
        formRf.current?.dispatchEvent(
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
        ref: inputRf,
        value: perceivedInputVal,
        onChange: onChange,
        onFocus: onFocus,
        onBlur: onBlur,
        onKeyDown: onKeyDown,
        autoComplete: 'off',
      };
    },
    [inputRf, perceivedInputVal, onChange, onFocus, onBlur, onKeyDown]
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
    setSelectedSuggestionIdSt(null);
  }

  return (
    <form ref={formRf} onSubmit={onFormSubmit} {...additionalFormProps}>
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
