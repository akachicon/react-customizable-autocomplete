import React, { forwardRef } from 'react';
import type { InputComponentFunction } from '../../types/autocomplete-search-props';

const InputComponent: InputComponentFunction = (
  { isFetching, inputProps },
  ref
) => (
  <label>
    search:
    <input ref={ref} name="q" {...inputProps} />
    {isFetching && <span>fetching...</span>}
  </label>
);

export default forwardRef(InputComponent);
