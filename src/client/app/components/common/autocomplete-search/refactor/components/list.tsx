import React, { useMemo, useCallback } from 'react';
import type { ListComponent as ListComponentType } from '../types';

type Data = null;

type ItemProps = {
  selected: boolean;
  dataAutocompleteId: string;
  onMouseDown: React.MouseEventHandler;
  onMouseOver: React.MouseEventHandler;
  text: string;
};

const ListItem = React.memo(function ListItem({
  selected,
  dataAutocompleteId,
  onMouseDown,
  onMouseOver,
  text,
}: ItemProps): JSX.Element {
  const backgroundColor = selected ? 'lightgrey' : 'transparent';

  return (
    <div
      style={{ backgroundColor }}
      data-autocomplete-id={dataAutocompleteId}
      onMouseDown={onMouseDown}
      onMouseOver={onMouseOver}
    >
      {text}
    </div>
  );
});

const ListComponent: ListComponentType<Data> = function ListComponent({
  suggestions,
  selectedId,
  suggestionHandlers: {
    onMouseDown: onSuggestionMouseDown,
    onMouseOver: onSuggestionMouseOver,
  },
}): JSX.Element {
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
        return (
          <ListItem
            key={s.id}
            selected={s.id === selectedId}
            dataAutocompleteId={s.id}
            onMouseDown={onMouseDown}
            onMouseOver={onMouseOver}
            text={s.text}
          />
        );
      })}
    </>
  );
};

export default ListComponent;
