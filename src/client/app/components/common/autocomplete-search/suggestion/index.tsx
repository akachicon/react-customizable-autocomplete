import React from 'react';
import type { SuggestionComponent } from '../lib/types/autocomplete-search-props';

const Suggestion: SuggestionComponent<unknown> = ({
  id,
  selected,
  data,
  onMouseOver,
}) => (
  <div onMouseOver={onMouseOver} data-autocomplete-search={id}>
    {data}, selected: {selected ? 'true' : 'false'}
  </div>
);

export default Suggestion;
