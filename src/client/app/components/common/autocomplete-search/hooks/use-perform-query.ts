import { MutableRefObject, useCallback } from 'react';
import {
  OnQueryReturnPromise,
  SuggestionResult,
} from '../types/autocomplete-search-props';

// TODO: utility types for refs and state setters
type Ref<T> = MutableRefObject<T>;

type Suggestions<SuggestionData = unknown> =
  | readonly SuggestionResult<SuggestionData>[]
  | null;

type SuggestionsSetter<SuggestionData = unknown> = (
  suggestions: Suggestions<SuggestionData>
) => void;

type Dependencies<SuggestionData = unknown> = {
  currentQueryRf: Ref<OnQueryReturnPromise<SuggestionData> | null>;
  obsoleteQueriesRf: Ref<OnQueryReturnPromise<SuggestionData>[]>;
  queryTimestampsRf: Ref<Map<OnQueryReturnPromise<SuggestionData>, number>>;
  latestResolvedQueryTimestampRf: Ref<number>;
  setSuggestionsSt: SuggestionsSetter<SuggestionData>;
  setSelectedSuggestionIdSt: (
    suggestion: SuggestionResult<SuggestionData>['id'] | null
  ) => void;
  setIsFetchingSt: (flag: boolean) => void;
  setShowQueryErrorSt: (flag: boolean) => void;
  hasLatestTimestamp: (
    queryPromise: OnQueryReturnPromise<SuggestionData>
  ) => boolean | undefined;
  makeQueryObsolete: (
    queryPromise: OnQueryReturnPromise<SuggestionData>
  ) => void;
  suggestionsLimit: number;
  onQuery: (query: string) => OnQueryReturnPromise<SuggestionData>;
};

export default function usePerformQuery<SuggestionData = unknown>({
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
}: Dependencies<SuggestionData>): (query: string) => void {
  return useCallback(
    function performQuery(query) {
      const disposableQuery = currentQueryRf.current;
      const queryPromise = onQuery(query);

      setIsFetchingSt(true);
      currentQueryRf.current = queryPromise;
      queryTimestampsRf.current.set(queryPromise, +new Date());

      if (disposableQuery) {
        makeQueryObsolete(disposableQuery);
      }

      function getQueryTimestamp() {
        return queryTimestampsRf.current.get(queryPromise);
      }

      function nullifyQueryPromise() {
        queryTimestampsRf.current.delete(queryPromise);
        obsoleteQueriesRf.current = obsoleteQueriesRf.current.filter(
          (p) => p !== queryPromise
        );

        // We don't want to nullify promises that come after the current.
        if (currentQueryRf.current === queryPromise) {
          currentQueryRf.current = null;
          setIsFetchingSt(false);
        }
      }

      function maybeUpdateSuggestions(
        querySuggestions: Readonly<SuggestionResult<SuggestionData>[]>
      ) {
        const hasLatestTs = hasLatestTimestamp(queryPromise);

        if (hasLatestTs) {
          latestResolvedQueryTimestampRf.current = getQueryTimestamp() as number;

          setShowQueryErrorSt(false);
          setSuggestionsSt(querySuggestions.slice(0, suggestionsLimit));
          setSelectedSuggestionIdSt(null);
        }
      }

      function maybeShowError() {
        // Case: two queries are in flight, the second resolves with error.
        // After this, the first query resolves with data. To prevent showing
        // data irrelevant to the request and hiding error message, save the
        // timestamp.
        const hasLatestTs = hasLatestTimestamp(queryPromise);
        if (hasLatestTs) {
          latestResolvedQueryTimestampRf.current = getQueryTimestamp() as number;
        }

        // Show the error only if this is the latest query
        // set in flight. If there are other queries in flight
        // the better UX is to show previous results over the error.

        if (currentQueryRf.current === queryPromise) {
          // The query will be obsolete when
          // - a query is on the flight (wrapping condition)
          // - the query was marked as obsolete with makeQueryObsolete
          // - the query was rejected in onQueryBecomesObsolete
          if (obsoleteQueriesRf.current.includes(queryPromise)) {
            return;
          }
          setShowQueryErrorSt(true);
          setSelectedSuggestionIdSt(null);
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
}
