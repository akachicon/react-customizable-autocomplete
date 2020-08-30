import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import SuggestionDefaultComp from './suggestion';
import NoResultsDefaultComp from './no-search-results';
import QueryErrorDefaultComp from './query-error';
import MinCharsRequiredDefaultComp from './min-chars-required';
import { keys } from '@constants/keyboard';

const { ARROW_UP, ARROW_DOWN, ESCAPE } = keys;

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

export type NoSearchResultsComponent = (props: { text: string }) => JSX.Element;
export type QueryErrorComponent = (props: { text: string }) => JSX.Element;
export type MinCharsRequiredComponent = (props: {
  text: string;
}) => JSX.Element;
export type LoaderComponent = () => JSX.Element;

export type Props<SuggestionData> = {
  label: string;
  name?: string;
  onQuery: (query: string) => onQueryReturnPromise<SuggestionData>;
  onQueryBecomesObsolete?: (queryPromise: onQueryReturnPromise) => void;
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
}: Props<SuggestionData>): JSX.Element {
  // TODO: use refs wherever possible to optimize

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
  const [isNavigatingSuggestions, setIsNavigatingSuggestions] = useState(false); // TODO: use ref
  const [showQueryError, setShowQueryError] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const currentQuery = useRef<onQueryReturnPromise | null>(null);
  const queryTimestamps = useRef(new Map<onQueryReturnPromise, number>());
  const latestResolvedQueryTimestamp = useRef(0);

  const debouncedInputValLength = debouncedInputVal.trim().length;
  const suggestionsExist = suggestions !== null;
  const suggestionsHaveLength = Boolean(suggestions?.length);

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

  const onChange = useCallback(function onChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    console.log('change');

    // TODO: remove isNavigatingSuggestions when value comes from the input
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

  const onKeyPress = useCallback(
    function onKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
      const isSpecialKeyUsed = [ARROW_DOWN, ARROW_UP, ESCAPE].some(
        (key) => key === e.key
      );
      if (!isSpecialKeyUsed) return;

      e.preventDefault();

      switch (e.key) {
        case ESCAPE:
          inputRef.current?.blur();
          break;

        case ARROW_DOWN:
          if (!suggestionsHaveLength) {
            setIsNavigatingSuggestions(false);
            setSelectedSuggestionId(null);
            return;
          }

          if (!isNavigatingSuggestions) {
            console.log('DOWN: start navigating suggestions');

            setIsNavigatingSuggestions(true);

            // suggestionsHaveLength guarantees `suggestions !== null`
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            setSelectedSuggestionId(suggestions![0].id);

            // Dispose current query.
            const query = currentQuery.current;
            if (query !== null) {
              queryTimestamps.current.delete(query);
              currentQuery.current = null;
              setIsFetching(false);

              if (onQueryBecomesObsolete) {
                onQueryBecomesObsolete(query);
              }
            }

            // TODO: set input safely
            // suggestionsHaveLength guarantees `suggestions !== null`
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const { data, transformDataIntoText } = suggestions![0];
            setPerceivedInputVal(transformDataIntoText(data));

            return;
          }

          if (isNavigatingSuggestions) {
            console.log('DOWN: continue navigating suggestions');

            // suggestionsHaveLength guarantees `suggestions !== null`
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const suggestionList = suggestions!;
            const selectedSuggestion = suggestionList.find(
              (s) => s.id === selectedSuggestionId
            );

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const selectedIdx = suggestionList.indexOf(selectedSuggestion!);
            const nextSuggestion = suggestionList[selectedIdx + 1];
            const newSelectedIdx = nextSuggestion
              ? selectedIdx + 1
              : selectedIdx;

            setSelectedSuggestionId(suggestionList[newSelectedIdx].id);

            // TODO: set input safely
            const { data, transformDataIntoText } = suggestionList[
              newSelectedIdx
            ];
            setPerceivedInputVal(transformDataIntoText(data));

            return;
          }
          break;

        case ARROW_UP:
          if (!isNavigatingSuggestions) {
            return;
          }

          if (isNavigatingSuggestions) {
            // suggestionsHaveLength guarantees `suggestions !== null`
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const suggestionList = suggestions!;
            const selectedSuggestion = suggestionList.find(
              (s) => s.id === selectedSuggestionId
            );

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const selectedIdx = suggestionList.indexOf(selectedSuggestion!);
            const newSelectedIdx = selectedIdx > 0 ? selectedIdx - 1 : null;
            const newSelectedId =
              newSelectedIdx === null
                ? null
                : suggestionList[newSelectedIdx].id;

            if (newSelectedId === null) {
              setIsNavigatingSuggestions(false);
            }
            setSelectedSuggestionId(newSelectedId);

            // TODO: set input safely
            if (newSelectedIdx !== null) {
              const { data, transformDataIntoText } = suggestionList[
                newSelectedIdx
              ];
              setPerceivedInputVal(transformDataIntoText(data));
            }

            return;
          }
          break;
      }
    },
    [
      onQueryBecomesObsolete,
      isNavigatingSuggestions,
      suggestions, // TODO: duplicate as ref
      selectedSuggestionId, // TODO: duplicate as ref
      suggestionsHaveLength, // TODO: duplicate as ref or compute
    ]
  );

  const onFormSubmit = useCallback(
    function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
      // TODO: passing selected suggestion
      e.preventDefault();
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
      console.log(suggestionsExist);

      if (debouncedInputValLength >= minCharsRequired) {
        performQuery(debouncedInputVal);
      } else if (suggestionsExist) {
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
    [
      minCharsRequired,
      debouncedInputVal,
      debouncedInputValLength,
      performQuery,
      suggestionsExist, // TODO: triggers additional fetch after min chars passed
    ]
  );

  // TODO: separate to use several useMemo, then debouncedInputVal
  //  won't trigger suggestions rerender.
  const containerComp = useMemo(
    function calcContainerComp() {
      const minCharsCheckPassed = debouncedInputValLength >= minCharsRequired;
      const C = {
        minCharsRequiredComponent,
        queryErrorComponent,
        suggestionComponent,
        noResultsComponent,
      };

      if (!minCharsCheckPassed) {
        return <C.minCharsRequiredComponent text={minCharsRequiredMessage} />;
      }
      if (showQueryError) {
        return <C.queryErrorComponent text={queryErrorMessage} />;
      }
      if (suggestionsExist && suggestionsHaveLength) {
        // TODO: use some cache
        return (
          <>
            {/* Due to suggestionsExist we will never get null value in suggestions */}
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            {suggestions!.map((s) => (
              <C.suggestionComponent
                key={s.id}
                data={s.data}
                selected={s.id === selectedSuggestionId}
              />
            ))}
          </>
        );
      }
      if (suggestionsExist && !suggestionsHaveLength) {
        return <C.noResultsComponent text={noResultsMessage} />;
      }

      // The case where we are past min chars but
      // the query is not resolved/rejected.
      return <C.minCharsRequiredComponent text={minCharsRequiredMessage} />;
    },
    [
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
    ]
  );

  return (
    <form onSubmit={onFormSubmit}>
      <label>
        {label}
        <input
          ref={inputRef}
          name={name}
          value={perceivedInputVal}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyUp={onKeyPress}
          autoComplete="off"
        />
      </label>
      {isFetching && <span>fetching suggestions</span>}
      {showContainer && <div>{containerComp}</div>}
    </form>
  );
}
