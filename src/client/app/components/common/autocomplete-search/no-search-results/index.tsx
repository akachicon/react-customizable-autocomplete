import React from 'react';
import type { NoSearchResultsComponent } from '../index';

const NoSearchResults: NoSearchResultsComponent = ({ text }) => (
  <span>{text}</span>
);

export default NoSearchResults;
