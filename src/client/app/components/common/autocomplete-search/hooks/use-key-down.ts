import React, { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { SuggestionResult } from '../types/autocomplete-search-props';
import { useBoundRef } from '@lib/utils';
import { keys } from '@constants/keyboard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dependencies<SuggestionData = any> = {
  suggestions: Readonly<SuggestionResult<SuggestionData>[]> | null;
  selectedSuggestionId: string | null;
  inputVal: string;
  input: MutableRefObject<HTMLInputElement | null>;
  setSelectedSuggestionId: (id: string | null) => unknown;
  setPerceivedInputVal: (val: string) => unknown;
  attemptSubmit: () => void;
};

type OnKeyDownCallback = React.KeyboardEventHandler<HTMLInputElement>;

const { ARROW_UP, ARROW_DOWN, ESCAPE, ENTER } = keys;

export default function useOnKeyDown<SuggestionData>({
  suggestions: suggestionsDep,
  selectedSuggestionId: suggestedSelectionIdDep,
  inputVal: inputValDep,
  input,
  setSelectedSuggestionId,
  setPerceivedInputVal,
  attemptSubmit,
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
      if (!suggestions.current) return;

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
      setNextSuggestion();
      return;
    },
    [suggestions, setNextSuggestion]
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
      const shouldHandle = [ARROW_DOWN, ARROW_UP, ESCAPE, ENTER].includes(
        e.key
      );
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

        case ENTER:
          attemptSubmit();
          break;
      }
    },
    [handleEscape, handleArrowDown, handleArrowUp, attemptSubmit]
  );
}
