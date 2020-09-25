import { AutocompleteProps } from './index';

// TODO: check

declare function Autocomplete<D = unknown>(
  props: AutocompleteProps<D>
): JSX.Element;

export as namespace Autocomplete;
export = Autocomplete;
