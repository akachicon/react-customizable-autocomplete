import React, { useRef, useMemo } from 'react';
import useState from 'react-use-batched-state';
import usePersistentObject from './use-persistent-object';
import debug from '../debug';
import type {
  ReadonlySuggestionManagerState,
  SuggestionId,
  SuggestionList as SuggestionItemList,
} from './use-suggestion-manager';

type ListComponentProps<D = unknown> = {
  suggestions: SuggestionItemList<D>;
  selectedId: SuggestionId;
  suggestionHandlers: {
    onMouseDown: (id: NonNullable<SuggestionId>) => void;
    onMouseOver: (id: NonNullable<SuggestionId>) => void;
  };
};

export type ListComponent<D = unknown> = React.ComponentType<
  ListComponentProps<D>
>;

export type MinCharsComponent = React.ComponentType;
export type NoResultsComponent = React.ComponentType;
export type ErrorComponent = React.ComponentType;

type SuggestionListArgs<D = unknown> = {
  listComponent: ListComponent<D>;
  minCharsComponent: MinCharsComponent;
  noResultsComponent: NoResultsComponent;
  errorComponent: ErrorComponent;
  gteMinChars: boolean;
  suggestionManagerState: ReadonlySuggestionManagerState<D>;
  onSuggestionMouseOver: (id: NonNullable<SuggestionId>) => void;
  onSuggestionMouseDown: (id: NonNullable<SuggestionId>) => void;
};

type SuggestionList<D = unknown> = {
  state: Readonly<{
    error: boolean;
  }>;
  setError: (err: boolean) => void;
  list:
    | {
        component: ListComponent<D>;
        props: ListComponentProps<D>;
      }
    | {
        component: MinCharsComponent | NoResultsComponent | ErrorComponent;
      };
};

export default function useSuggestionList<D = unknown>({
  listComponent,
  minCharsComponent,
  noResultsComponent,
  errorComponent,
  gteMinChars,
  suggestionManagerState,
  onSuggestionMouseOver,
  onSuggestionMouseDown,
}: SuggestionListArgs<D>): Readonly<SuggestionList<D>> {
  const [error, setError] = useState(false);
  const { suggestions, selectedId } = suggestionManagerState;

  const state = useRef({ error });
  state.current.error = error;

  const memoizedList = useMemo(
    function calcContainerComp() {
      debug.log('calcContainerComp');
      debug.log('gteMinChars', String(gteMinChars));

      if (!gteMinChars) {
        return { component: minCharsComponent };
      }

      if (error) {
        return { component: errorComponent };
      }

      // Since suggestions are immutable we can perform
      // length check safely.
      if (suggestions !== null && suggestions.length) {
        return {
          component: listComponent,
          props: {
            suggestions,
            selectedId,
            suggestionHandlers: {
              onMouseOver: onSuggestionMouseOver,
              onMouseDown: onSuggestionMouseDown,
            },
          },
        };
      }

      // Since suggestions are immutable we can perform
      // length check safely.
      if (suggestions !== null && !suggestions.length) {
        return { component: noResultsComponent };
      }

      // The case where we are past min chars but
      // suggestions are still null and no errors occurred.
      return { component: minCharsComponent };
    },
    [
      minCharsComponent,
      errorComponent,
      listComponent,
      noResultsComponent,
      gteMinChars,
      onSuggestionMouseOver,
      onSuggestionMouseDown,
      suggestions,
      selectedId,
      error,
    ]
  );

  const list = usePersistentObject(memoizedList);

  return usePersistentObject({
    state: state.current,
    setError,
    list,
  });
}
