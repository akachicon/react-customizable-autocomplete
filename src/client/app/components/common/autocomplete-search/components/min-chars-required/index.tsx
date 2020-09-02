import React from 'react';
import type { MinCharsRequiredComponent } from '../../types/autocomplete-search-props';

const MinCharsRequired: MinCharsRequiredComponent = ({ text }) => (
  <span>{text}</span>
);

export default MinCharsRequired;
