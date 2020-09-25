import React from 'react';
import type { SuggestionId, SuggestionList } from './hooks/use-suggestion-manager';
import type { OnQuerySignature, OnQueryBecomesObsoleteSignature } from './hooks/use-query-manager';
import type { ListComponent, MinCharsComponent, NoResultsComponent, ErrorComponent } from './hooks/use-suggestion-list';
import type { FormProps } from './hooks/use-form-props';
declare type OnSubmitSignature<D = unknown> = (args: {
    id: SuggestionId;
    query: string;
    suggestions: SuggestionList<D> | null;
}, event: React.FormEvent<HTMLFormElement>) => void;
export declare type InputComponent = React.ComponentType<{
    inputProps: JSX.IntrinsicElements['input'];
    isFetching: boolean;
}>;
export declare type ListContainerComponent = React.ComponentType<{
    containerProps: {
        onMouseLeave: React.MouseEventHandler;
    };
    isFetching: boolean;
    isOpen: boolean;
}>;
export declare type Props<D = unknown> = {
    onQuery: OnQuerySignature<D>;
    onQueryBecomesObsolete?: OnQueryBecomesObsoleteSignature<D>;
    onSubmit: OnSubmitSignature<D>;
    formProps?: FormProps;
    preserveInputOnSubmit?: boolean;
    debounceMs?: number;
    minCharsRequired?: number;
    inputComponent: InputComponent;
    listContainerComponent: ListContainerComponent;
    listComponent: ListComponent<D>;
    minCharsComponent: MinCharsComponent;
    noResultsComponent: NoResultsComponent;
    errorComponent: ErrorComponent;
};
export default function AutoCompleteSearch<D = unknown>({ onQuery, onQueryBecomesObsolete, onSubmit: consumerOnSubmit, formProps: consumerFormProps, preserveInputOnSubmit, debounceMs, minCharsRequired, inputComponent: Input, listContainerComponent: ListContainerComponent, listComponent, minCharsComponent, noResultsComponent, errorComponent, }: Props<D>): JSX.Element;
export {};
