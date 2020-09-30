import React from 'react';
import type { ListContainerComponentType } from 'react-customizable-autocomplete/types';
import stl from './styles.scss';

const ListContainerComponent: ListContainerComponentType = function ListContainerComponent({
  containerProps,
  isOpen,
  children,
}) {
  const style = {
    display: isOpen ? 'block' : 'none',
  };

  return (
    <div style={style} className={stl.suggestions} {...containerProps}>
      {children}
    </div>
  );
};

export default ListContainerComponent;
