import React from 'react';
import type { NoSearchResultsComponent } from '../../types/autocomplete-search-props';

const NoSearchResults: NoSearchResultsComponent = ({ text }) => (
  <span>{text}</span>
);

export default NoSearchResults;
