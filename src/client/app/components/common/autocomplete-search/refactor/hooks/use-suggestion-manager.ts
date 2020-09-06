import { useRef, useState, useCallback } from 'react';
import usePersistentObject from './use-persistent-object';

export type SuggestionId = string | null;

export type Suggestion<D = unknown> = Readonly<{
  id: SuggestionId;
  text: string;
  data: D;
}>;

export type SuggestionList<D = unknown> = readonly Suggestion<D>[];

type SuggestionManagerState<D> = {
  suggestions: SuggestionList<D> | null;
  selectedId: SuggestionId;
};

export type ReadonlySuggestionManagerState<D = unknown> = Readonly<
  SuggestionManagerState<D>
>;

type SuggestionManager<D = unknown> = Readonly<{
  state: ReadonlySuggestionManagerState<D>;
  setSuggestions: (suggestions: SuggestionList<D> | null) => void;
  getSuggestionById: (id: SuggestionId) => Suggestion<D> | null;
  selectId: (id: SuggestionId) => boolean;
  selectPrevious: () => Suggestion<D> | null;
  selectNext: () => Suggestion<D> | null;
}>;

export default function useSuggestionManager<D = unknown>(): SuggestionManager<
  D
> {
  const [selectedId, setSelectedId] = useState<SuggestionId>(null);
  const [suggestions, setSuggestions] = useState<SuggestionList<D> | null>([]);

  const state = useRef<SuggestionManagerState<D>>({
    suggestions,
    selectedId,
  });
  state.current.suggestions = suggestions;
  state.current.selectedId = selectedId;

  console.log(selectedId);

  const getSuggestionById = useCallback(function getSuggestionById(
    id: SuggestionId
  ) {
    return state.current.suggestions?.find((s) => s.id === id) ?? null;
  },
  []);

  const selectId = useCallback(function selectId(id: SuggestionId) {
    const isNull = id === null;
    const doesExist = state.current.suggestions?.some((s) => s.id === id);

    if (isNull || doesExist) {
      setSelectedId(id);
      return true;
    }
    return false;
  }, []);

  const selectPrevious = useCallback(
    function selectPrevious() {
      const { selectedId, suggestions } = state.current;

      if (selectedId === null || !suggestions?.length) {
        return null;
      }
      const selectedIdx = suggestions.findIndex((s) => s.id === selectedId);
      const previousIdx = selectedIdx > 0 ? selectedIdx - 1 : undefined;

      const previousSuggestion =
        previousIdx === undefined ? null : suggestions[previousIdx];
      const previousId = previousSuggestion?.id ?? null;

      selectId(previousId);
      return previousSuggestion;
    },
    [selectId]
  );

  const selectNext = useCallback(
    function selectNext() {
      const { selectedId, suggestions } = state.current;

      if (!suggestions?.length) return null;

      if (selectedId === null) {
        const nextSuggestion = suggestions[0];
        selectId(nextSuggestion.id);
        return nextSuggestion;
      }

      const selectedIdx = suggestions.findIndex((s) => s.id === selectedId);
      const isLastIdx = selectedIdx + 1 === suggestions.length;
      const nextIdx = selectedIdx + Number(!isLastIdx);
      const nextSuggestion = suggestions[nextIdx];

      selectId(nextSuggestion.id);
      return nextSuggestion;
    },
    [selectId]
  );

  if (selectedId !== null && !suggestions?.length) {
    selectId(null);
  }

  return usePersistentObject({
    state: state.current,
    setSuggestions,
    getSuggestionById,
    selectId,
    selectPrevious,
    selectNext,
  });
}
