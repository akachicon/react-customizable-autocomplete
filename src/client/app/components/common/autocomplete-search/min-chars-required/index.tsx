import React from 'react';
import type { MinCharsRequiredComponent } from '../lib/types/autocomplete-search-props';

const MinCharsRequired: MinCharsRequiredComponent = ({ text }) => (
  <span>{text}</span>
);

export default MinCharsRequired;
