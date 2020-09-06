import React, { useMemo, useCallback } from 'react';
import type { ListComponent as ListComponentType } from '../types';

type Data = null;

const ListComponent: ListComponentType<Data> = function ListComponent({
  suggestions,
  selectedId,
  suggestionHandlers: {
    onMouseDown: onSuggestionMouseDown,
    onMouseOver: onSuggestionMouseOver,
  },
}) {
  const slicedSuggestions = useMemo(
    function slicedSuggestions() {
      return suggestions.slice(7);
    },
    [suggestions]
  );

  const onMouseDown = useCallback(
    function onMouseDown(e: React.MouseEvent) {
      onSuggestionMouseDown(
        e.currentTarget.getAttribute('data-autocomplete-id')
      );
    },
    [onSuggestionMouseDown]
  );

  const onMouseOver = useCallback(
    function onMouseDown(e: React.MouseEvent) {
      onSuggestionMouseOver(
        e.currentTarget.getAttribute('data-autocomplete-id')
      );
    },
    [onSuggestionMouseOver]
  );

  return (
    <>
      {slicedSuggestions.map(function renderSuggestion(s) {
        const backgroundColor =
          s.id === selectedId ? 'lightgrey' : 'transparent';

        return (
          <div
            key={s.id}
            style={{ backgroundColor }}
            data-autocomplete-id={s.id}
            onMouseDown={onMouseDown}
            onMouseOver={onMouseOver}
          >
            {s.text}
          </div>
        );
      })}
    </>
  );
};

export default ListComponent;
