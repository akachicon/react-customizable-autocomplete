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
  suggestionsHaveLength: boolean;
  selectedSuggestionId: string | null;
  inputVal: string;
  input: MutableRefObject<HTMLInputElement | null>;
  currentQuery: MutableRefObject<OnQueryReturnPromise | null>;
  queryTimestamps: MutableRefObject<Map<OnQueryReturnPromise, number>>;
  isNavigatingSuggestions: MutableRefObject<boolean>;
  setSelectedSuggestionId: (id: string | null) => unknown;
  setPerceivedInputVal: (val: string) => unknown;
  setIsFetching: (isFetching: boolean) => unknown;
};

type OnKeyDownCallback = React.KeyboardEventHandler<HTMLInputElement>;

const { ARROW_UP, ARROW_DOWN, ESCAPE } = keys;

export default function useOnKeyDown<SuggestionData>({
  onQueryBecomesObsolete,
  suggestions: suggestionsDep,
  suggestionsHaveLength: suggestionsHaveLengthDep,
  selectedSuggestionId: suggestedSelectionIdDep,
  inputVal: inputValDep,
  input,
  currentQuery,
  queryTimestamps,
  isNavigatingSuggestions,
  setSelectedSuggestionId,
  setPerceivedInputVal,
  setIsFetching,
}: Dependencies<SuggestionData>): OnKeyDownCallback {
  const suggestions = useBoundRef<Dependencies['suggestions']>(suggestionsDep);
  const suggestionsHaveLength = useBoundRef(suggestionsHaveLengthDep);
  const selectedSuggestionId = useBoundRef(suggestedSelectionIdDep);
  const inputVal = useBoundRef(inputValDep);

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

  const handleEscape = useCallback(
    function handleEscape() {
      input.current?.blur();
    },
    [input]
  );

  const handleArrowDown = useCallback(
    function handleArrowDown() {
      if (!suggestionsHaveLength.current) {
        return;
      }

      if (!isNavigatingSuggestions.current) {
        isNavigatingSuggestions.current = true;

        // suggestionsHaveLength guarantees `suggestions !== null`
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setSelectedSuggestionId(suggestions.current![0].id);

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
        setPerceivedInput(0);
        return;
      }

      // suggestionsHaveLength guarantees `suggestions !== null`
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const suggestionList = suggestions.current!;

      // TODO: possible optimization
      const selectedIdx = suggestionList.findIndex(
        (s) => s.id === selectedSuggestionId.current
      );

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const nextSuggestion = suggestionList[selectedIdx + 1];
      const newSelectedIdx = nextSuggestion ? selectedIdx + 1 : selectedIdx;

      setSelectedSuggestionId(suggestionList[newSelectedIdx].id);
      setPerceivedInput(newSelectedIdx);

      return;
    },
    [
      currentQuery,
      queryTimestamps,
      isNavigatingSuggestions,
      suggestions,
      suggestionsHaveLength,
      selectedSuggestionId,
      setSelectedSuggestionId,
      setIsFetching,
      onQueryBecomesObsolete,
      setPerceivedInput,
    ]
  );

  const handleArrowUp = useCallback(
    function handleArrowUp() {
      if (!isNavigatingSuggestions.current) {
        return;
      }

      // isNavigatingSuggestions guarantees `suggestions !== null`
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const suggestionList = suggestions.current!;
      const selectedIdx = suggestionList.findIndex(
        (s) => s.id === selectedSuggestionId.current
      );

      const newSelectedIdx = selectedIdx > 0 ? selectedIdx - 1 : null;
      const newSelectedId =
        newSelectedIdx === null ? null : suggestionList[newSelectedIdx].id;

      if (newSelectedId === null) {
        isNavigatingSuggestions.current = false;
      }
      setSelectedSuggestionId(newSelectedId);
      setPerceivedInput(newSelectedIdx);

      return;
    },
    [
      isNavigatingSuggestions,
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
