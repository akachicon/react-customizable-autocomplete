import React from 'react';
import type { SuggestionComponent } from '../lib/types/autocomplete-search-props';

const Suggestion: SuggestionComponent<unknown> = ({ selected, data }) => {
  console.log('render', data);
  return (
    <div>
      {data}, selected: {selected ? 'true' : 'false'}
    </div>
  );
};
export default Suggestion;
