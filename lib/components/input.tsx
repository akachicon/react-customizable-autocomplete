import React from 'react';
import type { InputComponent as InputComponentType } from '../types';

const InputComponent: InputComponentType = function InputComponent({
  inputProps,
}) {
  return <input {...inputProps} />;
};

export default InputComponent;
