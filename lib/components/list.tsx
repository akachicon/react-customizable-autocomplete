import React, { useCallback } from 'react';
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
  const onMouseDown = useCallback(
    function onMouseDown(e: React.MouseEvent) {
      const id = e.currentTarget.getAttribute('data-autocomplete-id');
      if (id !== null) {
        onSuggestionMouseDown(id);
      }
    },
    [onSuggestionMouseDown]
  );

  const onMouseOver = useCallback(
    function onMouseDown(e: React.MouseEvent) {
      const id = e.currentTarget.getAttribute('data-autocomplete-id');
      if (id !== null) {
        onSuggestionMouseOver(id);
      }
    },
    [onSuggestionMouseOver]
  );

  return (
    <>
      {suggestions.map(function renderSuggestion(s) {
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
