import { useCallback, useRef } from 'react';
import useState from 'react-use-batched-state';
import usePersistentObject from '../use-persistent-object';
import type { OnQueryReturnType } from './index';

type ManagerState<D = unknown> = {
  timestamps: Map<OnQueryReturnType<D>, number>;
  lastResolvedTimestamp: number;
  disposalTimestamp: number;
  currentQuery: OnQueryReturnType<D> | null;
};

type ReadonlyTimestamps<D = unknown> = {
  timestamps: ReadonlyMap<OnQueryReturnType<D>, number>;
};

type ReadonlyManagerState<D = unknown> = Omit<
  Readonly<ManagerState<D>>,
  'timestamps'
> &
  ReadonlyTimestamps<D>;

type MergedState<D = unknown> = Partial<
  Omit<Readonly<ManagerState<D>>, 'timestamps'> & {
    timestamps: (
      add: (query: OnQueryReturnType<D>, value: number) => void,
      remove: (query: OnQueryReturnType<D>) => void
    ) => void;
  }
>;

type ExposedManagerState = {
  isFetching: boolean;
};

export type ReadonlyExposedManagerState = Readonly<ExposedManagerState>;

type QueryManagerState<D = unknown> = Readonly<{
  state: ReadonlyManagerState<D>;
  exposedState: ReadonlyExposedManagerState;
  setState: (mergedState: MergedState<D>) => ReadonlyManagerState<D>;
}>;

export default function useManagerState<D>(): QueryManagerState<D> {
  const getFreshState = useCallback(function getFreshState(): ManagerState<D> {
    return {
      timestamps: new Map<OnQueryReturnType<D>, number>(),
      lastResolvedTimestamp: 0,
      disposalTimestamp: 0,
      currentQuery: null,
    };
  }, []);

  const [state] = useState(() => ({ current: getFreshState() }));
  const [isFetching, setIsFetching] = useState(false);

  const exposedState = useRef<ExposedManagerState>({ isFetching });
  exposedState.current.isFetching = isFetching;

  const setState = useCallback(
    function setState(mergedState: MergedState<D>): ReadonlyManagerState<D> {
      // We call reactive setters to rerender component any time
      // one of the exposed fields changes. The reason is that
      // hook consumers can rely on the fields in their hook
      // dependencies.

      if (mergedState.currentQuery !== undefined) {
        setIsFetching(Boolean(mergedState.currentQuery));
      }

      if (mergedState.timestamps) {
        mergedState.timestamps(
          function mapSet(query, time) {
            state.current.timestamps.set(query, time);
          },
          function mapDelete(query) {
            state.current.timestamps.delete(query);
          }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timestamps, ...assignedProps } = mergedState;

      return (state.current = Object.assign(state.current, assignedProps));
    },
    [state]
  );

  return usePersistentObject({
    state: state.current,
    exposedState: exposedState.current,
    setState,
  });
}
