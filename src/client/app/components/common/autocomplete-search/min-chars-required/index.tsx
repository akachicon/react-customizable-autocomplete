import React from 'react';
import type { MinCharsRequiredComponent } from '../index';

const MinCharsRequired: MinCharsRequiredComponent = ({ text }) => (
  <span>{text}</span>
);

export default MinCharsRequired;
