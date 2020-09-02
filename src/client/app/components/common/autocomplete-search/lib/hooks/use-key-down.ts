import React, { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type {
  AutocompleteSearchProps,
  SuggestionResult,
  OnQueryReturnPromise,
} from '../types/autocomplete-search-props';
import { useBoundRef } from '@lib/utils';
import { keys } from '@constants/keyboard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dependencies<SuggestionData = any> = Pick<
  AutocompleteSearchProps<SuggestionData>,
  'onQueryBecomesObsolete'
> & {
  suggestions: SuggestionResult<SuggestionData>[] | null;
  selectedSuggestionId: string | null;
  inputVal: string;
  input: MutableRefObject<HTMLInputElement | null>;
  currentQuery: MutableRefObject<OnQueryReturnPromise | null>;
  queryTimestamps: MutableRefObject<Map<OnQueryReturnPromise, number>>;
  setSelectedSuggestionId: (id: string | null) => unknown;
  setPerceivedInputVal: (val: string) => unknown;
  setIsFetching: (isFetching: boolean) => unknown;
};

type OnKeyDownCallback = React.KeyboardEventHandler<HTMLInputElement>;

const { ARROW_UP, ARROW_DOWN, ESCAPE } = keys;

export default function useOnKeyDown<SuggestionData>({
  onQueryBecomesObsolete,
  suggestions: suggestionsDep,
  selectedSuggestionId: suggestedSelectionIdDep,
  inputVal: inputValDep,
  input,
  currentQuery,
  queryTimestamps,
  setSelectedSuggestionId,
  setPerceivedInputVal,
  setIsFetching,
}: Dependencies<SuggestionData>): OnKeyDownCallback {
  const suggestions = useBoundRef<Dependencies['suggestions']>(suggestionsDep);
  const selectedSuggestionId = useBoundRef(suggestedSelectionIdDep);
  const inputVal = useBoundRef(inputValDep);

  const handleEscape = useCallback(
    function handleEscape() {
      input.current?.blur();
    },
    [input]
  );

  const setPerceivedInput = useCallback(
    function setPerceivedInput(suggestionIdx: number | null) {
      if (suggestions.current === null) return;

      if (suggestionIdx === null) {
        setPerceivedInputVal(inputVal.current);
        return;
      }

      const suggestion = suggestions.current[suggestionIdx];
      if (suggestion) {
        setPerceivedInputVal(suggestion.transformDataIntoText(suggestion.data));
      }
    },
    [suggestions, inputVal, setPerceivedInputVal]
  );

  const setNextSuggestion = useCallback(
    function setNextSuggestionId() {
      if (!suggestions.current?.length) return;

      if (selectedSuggestionId === null) {
        setSelectedSuggestionId(suggestions.current[0].id);
        setPerceivedInput(0);
        return;
      }

      // TODO: possible optimization
      const selectedIdx = suggestions.current.findIndex(
        (s) => s.id === selectedSuggestionId.current
      );

      const nextSuggestion = suggestions.current[selectedIdx + 1];
      const newSelectedIdx = nextSuggestion ? selectedIdx + 1 : selectedIdx;

      setSelectedSuggestionId(suggestions.current[newSelectedIdx].id);
      setPerceivedInput(newSelectedIdx);
    },
    [
      suggestions,
      selectedSuggestionId,
      setSelectedSuggestionId,
      setPerceivedInput,
    ]
  );

  const handleArrowDown = useCallback(
    function handleArrowDown() {
      if (!suggestions.current?.length) {
        return;
      }

      if (selectedSuggestionId === null) {
        // Dispose current query since the use doesn't want to get
        // an update after they started to to interact with the list.
        const query = currentQuery.current;
        if (query !== null) {
          // TODO: encapsulate query functionality
          queryTimestamps.current.delete(query);
          currentQuery.current = null;
          setIsFetching(false);

          if (onQueryBecomesObsolete) {
            onQueryBecomesObsolete(query);
          }
        }
      }
      setNextSuggestion();
      return;
    },
    [
      currentQuery,
      queryTimestamps,
      suggestions,
      selectedSuggestionId,
      setIsFetching,
      onQueryBecomesObsolete,
      setNextSuggestion,
    ]
  );

  const handleArrowUp = useCallback(
    function handleArrowUp() {
      if (selectedSuggestionId === null || !suggestions.current?.length) {
        return;
      }

      const selectedIdx = suggestions.current.findIndex(
        (s) => s.id === selectedSuggestionId.current
      );

      const newSelectedIdx = selectedIdx > 0 ? selectedIdx - 1 : null;
      const newSelectedId =
        newSelectedIdx === null ? null : suggestions.current[newSelectedIdx].id;

      setSelectedSuggestionId(newSelectedId);
      setPerceivedInput(newSelectedIdx);
      return;
    },
    [
      suggestions,
      selectedSuggestionId,
      setSelectedSuggestionId,
      setPerceivedInput,
    ]
  );

  return useCallback(
    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      const shouldHandle = [ARROW_DOWN, ARROW_UP, ESCAPE].includes(e.key);
      if (!shouldHandle) return;
      e.preventDefault();

      switch (e.key) {
        case ESCAPE:
          handleEscape();
          break;

        case ARROW_DOWN:
          handleArrowDown();
          break;

        case ARROW_UP:
          handleArrowUp();
          break;
      }
    },
    [handleEscape, handleArrowDown, handleArrowUp]
  );
}
