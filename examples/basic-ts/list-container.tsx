import React from 'react';
import type { ListContainerComponentType } from '@akachicon/react-customizable-autocomplete/types';

const ListContainerComponent: ListContainerComponentType = function ListContainerComponent({
  containerProps: { onMouseLeave },
  isFetching,
  isOpen,
  children,
}) {
  const wrapperStyle = {
    position: 'relative' as const,
  };
  const containerStyle = {
    display: isOpen ? 'block' : 'none',
    position: 'absolute' as const,
  };

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle} onMouseLeave={onMouseLeave}>
        {isFetching && <div>Loading...</div>}
        {children}
      </div>
    </div>
  );
};

export default ListContainerComponent;
