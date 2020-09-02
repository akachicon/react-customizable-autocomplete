import React, { useRef, useCallback, useMemo, createElement } from 'react';
import {
  AutocompleteSearchProps,
  SuggestionResult,
  SuggestionHTMLElement,
} from '../types/autocomplete-search-props';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SuggestionType<SuggestionData = any> = Required<
  AutocompleteSearchProps<SuggestionData>
>['suggestionComponent'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SuggestionListArgs<SuggestionData = any> = {
  suggestions: Readonly<SuggestionResult<SuggestionData>[]> | null;
  Suggestion: SuggestionType<SuggestionData>;
  setSelectedSuggestionId: (id: string) => unknown;
  attemptSubmit: (text: string) => void;
};

type SuggestionListReturnType = (
  selectedSuggestionId: string | null
) => JSX.Element;

type Cache = {
  selected: Record<string, JSX.Element>;
  unselected: Record<string, JSX.Element>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useSuggestionList<SuggestionData = any>({
  suggestions,
  Suggestion,
  setSelectedSuggestionId,
  attemptSubmit,
}: SuggestionListArgs<SuggestionData>): SuggestionListReturnType {
  const cache = useRef<Cache>({
    selected: {},
    unselected: {},
  });

  const onMouseOver = useCallback(
    function onMouseOver(e: React.MouseEvent<SuggestionHTMLElement>) {
      const id = e.currentTarget.dataset.autocompleteSearch;
      setSelectedSuggestionId(id);
    },
    [setSelectedSuggestionId]
  );

  const onMouseDown = useCallback(
    function onMouseDown(e: React.MouseEvent<SuggestionHTMLElement>) {
      e.preventDefault();
      attemptSubmit(e.currentTarget.dataset.autocompleteSearch);
    },
    [attemptSubmit]
  );

  const getCached = useCallback(
    function getCached(
      id: string,
      data: SuggestionData,
      selected: boolean
    ): JSX.Element {
      const cachePartitionName = selected ? 'selected' : 'unselected';
      const cachePartition = cache.current[cachePartitionName];

      if (cachePartition[id]) {
        return cachePartition[id];
      }
      const selectedSuggestion = createElement(Suggestion, {
        key: id,
        id,
        data,
        selected,
        onMouseOver,
        onMouseDown,
      });
      return (cachePartition[id] = selectedSuggestion);
    },
    [Suggestion, onMouseOver, onMouseDown]
  );

  return useMemo(
    function initListCreator(): SuggestionListReturnType {
      cache.current = {
        selected: {},
        unselected: {},
      };

      return function getSuggestionList(selectedSuggestionId) {
        return (
          <>
            {suggestions &&
              suggestions.map(function getSuggestion(s) {
                return getCached(s.id, s.data, s.id === selectedSuggestionId);
              })}
          </>
        );
      };
    },
    [suggestions, getCached]
  );
}
