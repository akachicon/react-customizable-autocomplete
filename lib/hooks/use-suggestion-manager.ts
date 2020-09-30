import { useRef, useCallback } from 'react';
import useState from 'react-use-batched-state';
import usePersistentObject from './use-persistent-object';

export type SuggestionId = string | null;

export type Suggestion<D = unknown> = Readonly<{
  id: NonNullable<SuggestionId>;
  text: string;
  data?: D;
}>;

export type SuggestionList<D = unknown> = readonly Suggestion<D>[];

export type SuggestionListState<D = unknown> =
  | SuggestionList<D>
  | null
  | undefined;

type SuggestionManagerState<D> = {
  suggestions: SuggestionListState<D>;
  selectedId: SuggestionId;
};

export type ReadonlySuggestionManagerState<D = unknown> = Readonly<
  SuggestionManagerState<D>
>;

type SuggestionManager<D = unknown> = Readonly<{
  state: ReadonlySuggestionManagerState<D>;
  setSuggestions: (suggestions: SuggestionListState<D>) => void;
  getSuggestionById: (id: SuggestionId) => Suggestion<D> | null;
  selectId: (id: SuggestionId) => boolean;
  selectPrevious: () => Suggestion<D> | null;
  selectNext: () => Suggestion<D> | null;
}>;

type SuggestionMap = Record<NonNullable<SuggestionId>, Suggestion<any>>;

export default function useSuggestionManager<D = unknown>(): SuggestionManager<
  D
> {
  const [selectedId, setSelectedId] = useState<SuggestionId>(null);
  const [suggestions, setSuggestions] = useState<SuggestionListState<D>>([]);
  const suggestionMap = useRef<SuggestionMap>({});

  const state = useRef<SuggestionManagerState<D>>({
    suggestions,
    selectedId,
  });
  state.current.suggestions = suggestions;
  state.current.selectedId = selectedId;

  const getSuggestionById = useCallback(function getSuggestionById(
    id: SuggestionId
  ) {
    if (id === null) {
      return null;
    }
    return suggestionMap.current[id] ?? null;
  },
  []);

  const selectId = useCallback(function selectId(id: SuggestionId) {
    const isAcceptable =
      id === null ? true : Boolean(suggestionMap.current[id]);

    if (!isAcceptable) return false;

    setSelectedId(id);
    return true;
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

  const updateSuggestions = useCallback(function updateSuggestions(
    suggestions: SuggestionListState<D>
  ) {
    setSuggestions(suggestions);

    if (!suggestions) {
      suggestionMap.current = {};
      return;
    }
    suggestionMap.current = suggestions.reduce<SuggestionMap>(
      function saveSuggestionToMap(acc, s) {
        acc[s.id] = s;
        return acc;
      },
      {}
    );
  },
  []);

  if (selectedId !== null && !suggestions?.length) {
    selectId(null);
  }

  return usePersistentObject({
    state: state.current,
    setSuggestions: updateSuggestions,
    getSuggestionById,
    selectId,
    selectPrevious,
    selectNext,
  });
}
