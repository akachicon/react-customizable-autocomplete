import { AutocompleteProps } from './index';

declare function ReactCustomizableAutocomplete<D = unknown>(
  props: AutocompleteProps<D>
): JSX.Element;

export as namespace ReactCustomizableAutocomplete;
export = ReactCustomizableAutocomplete;
