import type { OnQueryReturnType } from './index';
declare type ManagerState<D = unknown> = {
    timestamps: Map<OnQueryReturnType<D>, number>;
    lastResolvedTimestamp: number;
    disposalTimestamp: number;
    currentQuery: OnQueryReturnType<D> | null;
};
declare type ReadonlyTimestamps<D = unknown> = {
    timestamps: ReadonlyMap<OnQueryReturnType<D>, number>;
};
declare type ReadonlyManagerState<D = unknown> = Omit<Readonly<ManagerState<D>>, 'timestamps'> & ReadonlyTimestamps<D>;
declare type MergedState<D = unknown> = Partial<Omit<Readonly<ManagerState<D>>, 'timestamps'> & {
    timestamps: (add: (query: OnQueryReturnType<D>, value: number) => void, remove: (query: OnQueryReturnType<D>) => void) => void;
}>;
declare type ExposedManagerState<D = unknown> = {
    isFetching: boolean;
};
export declare type ReadonlyExposedManagerState<D = unknown> = Readonly<ExposedManagerState<D>>;
declare type QueryManagerState<D = unknown> = Readonly<{
    state: ReadonlyManagerState<D>;
    exposedState: ReadonlyExposedManagerState<D>;
    setState: (mergedState: MergedState<D>) => ReadonlyManagerState<D>;
}>;
export default function useManagerState<D>(): QueryManagerState<D>;
export {};
