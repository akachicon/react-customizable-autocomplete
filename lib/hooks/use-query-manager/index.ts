import { useCallback } from 'react';
import useManagerState from './use-manager-state';
import usePersistentObject from '../use-persistent-object';
import type { SuggestionList } from '../use-suggestion-manager';
import type { ReadonlyExposedManagerState } from './use-manager-state';
import debug from '../../debug';

export type OnQueryReturnType<D = unknown> = Promise<SuggestionList<D>>;

export type OnQuerySignature<D = unknown> = (
  query: string
) => OnQueryReturnType<D>;

export type OnQueryBecomesObsoleteSignature<D = unknown> = (
  queryResult: OnQueryReturnType<D>
) => void;

export type OnDataSignature<D = unknown> = {
  (error: boolean, suggestions: SuggestionList<D> | null): void;
};

type QueryManagerArgs<D = unknown> = {
  onQuery: OnQuerySignature<D>;
  onQueryBecomesObsolete: undefined | OnQueryBecomesObsoleteSignature<D>;
  onData: OnDataSignature<D>;
};

type QueryManager<D = unknown> = Readonly<{
  state: ReadonlyExposedManagerState<D>;
  disposeQueries: () => void;
  performQuery: (query: string) => void;
}>;

export default function useQueryManager<D>({
  onQuery,
  onQueryBecomesObsolete,
  onData,
}: QueryManagerArgs<D>): QueryManager<D> {
  const { state, exposedState, setState } = useManagerState<D>();

  const makeQueryObsolete = useCallback(
    function makeQueryObsolete(query: OnQueryReturnType<D>) {
      if (onQueryBecomesObsolete) {
        onQueryBecomesObsolete(query);
      }
    },
    [onQueryBecomesObsolete]
  );

  const disposeQueries = useCallback(
    function disposeQueries() {
      const { currentQuery } = state;

      if (!currentQuery) return;

      makeQueryObsolete(currentQuery);

      setState({
        currentQuery: null,
        disposalTimestamp: +new Date(),
      });
    },
    [makeQueryObsolete, state, setState]
  );

  const isLatestResolved = useCallback(
    function isLatestResolved(queryPromise: OnQueryReturnType<D>) {
      const { lastResolvedTimestamp, timestamps } = state;
      const queryPromiseTimestamp = timestamps.get(queryPromise);

      if (queryPromiseTimestamp === undefined) {
        return undefined;
      }
      return queryPromiseTimestamp > lastResolvedTimestamp;
    },
    [state]
  );

  const performQuery = useCallback(
    function performQuery(query: string) {
      const { currentQuery } = state;

      const queryPromise = onQuery(query);
      const queryPromiseTimestamp = +new Date();

      if (currentQuery) {
        makeQueryObsolete(currentQuery);
      }

      setState({
        currentQuery: queryPromise,
        timestamps(add) {
          add(queryPromise, queryPromiseTimestamp);
        },
      });

      function hasValidTimestamp() {
        const { disposalTimestamp, timestamps } = state;

        if ((timestamps.get(queryPromise) as number) > disposalTimestamp) {
          return true;
        }
        return Boolean(isLatestResolved(queryPromise));
      }

      function nullifyQueryPromise(
        error: boolean,
        querySuggestions: SuggestionList<D> | null
      ) {
        const { currentQuery } = state;
        const hasValidTs = hasValidTimestamp();

        // 'Valid' means latest and after disposal.
        if (hasValidTs) {
          setState({
            lastResolvedTimestamp: queryPromiseTimestamp,
          });
        }
        if (hasValidTs && !error) {
          onData(false, querySuggestions);
        }
        if (hasValidTs && error) {
          // Show the error only if this is the latest query
          // set in flight. If there are other queries in flight
          // the better UX is to show previous result over the error.

          if (currentQuery === queryPromise) {
            onData(true, null);
          }
        }

        setState({
          ...(currentQuery === queryPromise && {
            currentQuery: null,
          }),
          timestamps(_, remove) {
            remove(queryPromise);
          },
        });
      }

      queryPromise.then(
        function handleSuggestions(querySuggestions) {
          debug.log('response sync phase: start');
          nullifyQueryPromise(false, querySuggestions);
          debug.log('response sync phase: end');
        },
        function handleQueryError() {
          nullifyQueryPromise(true, null);
        }
      );
    },
    [onQuery, onData, makeQueryObsolete, isLatestResolved, state, setState]
  );

  return usePersistentObject({
    state: exposedState,
    disposeQueries,
    performQuery,
  });
}
