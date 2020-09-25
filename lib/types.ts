export type {
  Suggestion,
  SuggestionId,
  SuggestionList,
} from './hooks/use-suggestion-manager';

export type {
  OnQuerySignature,
  OnQueryBecomesObsoleteSignature,
} from './hooks/use-query-manager';

export type {
  ListComponent,
  MinCharsComponent,
  NoResultsComponent,
  ErrorComponent,
} from './hooks/use-suggestion-list';

import type {
  Props as AutocompleteProps,
  InputComponent,
  ListContainerComponent,
} from './index';

export type { AutocompleteProps, InputComponent, ListContainerComponent };

export type AutocompleteComponentType<D = unknown> = (
  props: AutocompleteProps<D>
) => JSX.Element;
