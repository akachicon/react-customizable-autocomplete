import React from 'react';
import type { ContainerComponentProps } from '../../types/autocomplete-search-props';

export default function ContainerComponent({
  isFetching,
  isOpen,
  containerProps,
  children,
}: ContainerComponentProps): JSX.Element {
  const display = isOpen ? 'block' : 'none';

  return (
    <div style={{ display }} {...containerProps}>
      <div>container comp</div>
      {isFetching && <div>fetching...</div>}
      {children}
    </div>
  );
}
