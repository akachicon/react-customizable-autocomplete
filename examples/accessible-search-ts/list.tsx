import React, { useCallback } from 'react';
import type { ListComponentType } from 'react-customizable-autocomplete/types';
import { listboxId, labelId } from './constants';
import stl from './styles.scss';
import type { Data } from './types';

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
  const className = [
    stl['suggestions__item'],
    selected ? stl['suggestions__item_selected'] : '',
  ].join(' ');

  return (
    <li
      id={dataAutocompleteId}
      className={className}
      data-autocomplete-id={dataAutocompleteId}
      role="option"
      aria-selected={selected}
      onMouseDown={onMouseDown}
      onMouseOver={onMouseOver}
    >
      {text}
    </li>
  );
});

const List: ListComponentType<Data> = function List({
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
    <ul
      id={listboxId}
      className={stl['suggestions__list']}
      aria-labelledby={labelId}
      role="listbox"
    >
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
    </ul>
  );
};

export default List;
