import React from 'react';
import type { SuggestionComponent } from '../../types/autocomplete-search-props';

const Suggestion: SuggestionComponent<unknown> = ({
  id,
  selected,
  data,
  onMouseOver,
  onMouseDown,
}) => (
  <div
    onMouseOver={onMouseOver}
    onMouseDown={onMouseDown}
    data-autocomplete-search={id}
  >
    {data}, selected: {selected ? 'true' : 'false'}
  </div>
);

export default Suggestion;
