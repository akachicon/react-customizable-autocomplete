import type { SuggestionList } from '../use-suggestion-manager';
import type { ReadonlyExposedManagerState } from './use-manager-state';
export declare type OnQueryReturnType<D = unknown> = Promise<SuggestionList<D>>;
export declare type OnQuerySignature<D = unknown> = (query: string) => OnQueryReturnType<D>;
export declare type OnQueryBecomesObsoleteSignature<D = unknown> = (queryResult: OnQueryReturnType<D>) => void;
export declare type OnDataSignature<D = unknown> = {
    (error: boolean, suggestions: SuggestionList<D> | null): void;
};
declare type QueryManagerArgs<D = unknown> = {
    onQuery: OnQuerySignature<D>;
    onQueryBecomesObsolete: undefined | OnQueryBecomesObsoleteSignature<D>;
    onData: OnDataSignature<D>;
};
declare type QueryManager<D = unknown> = Readonly<{
    state: ReadonlyExposedManagerState<D>;
    disposeQueries: () => void;
    performQuery: (query: string) => void;
}>;
export default function useQueryManager<D>({ onQuery, onQueryBecomesObsolete, onData, }: QueryManagerArgs<D>): QueryManager<D>;
export {};
