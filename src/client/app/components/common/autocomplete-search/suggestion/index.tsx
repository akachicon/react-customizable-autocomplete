import React from 'react';
import type { SuggestionComponent } from '../index';

const Suggestion: SuggestionComponent<unknown> = ({ selected, data }) => (
  <div>
    {data}, selected: {selected ? 'true' : 'false'}
  </div>
);

export default Suggestion;
