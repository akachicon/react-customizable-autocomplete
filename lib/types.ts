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
  ListComponent as ListComponentType,
  MinCharsComponent as MinCharsComponentType,
  NoResultsComponent as NoResultsComponentType,
  ErrorComponent as ErrorComponentType,
} from './hooks/use-suggestion-list';

import type {
  Props as AutocompleteProps,
  OnSubmitSignature,
  InputComponent,
  ListContainerComponent,
} from './index';

export type {
  AutocompleteProps,
  OnSubmitSignature,
  InputComponent as InputComponentType,
  ListContainerComponent as ListContainerComponentType,
};

export type AutocompleteComponentType<D = unknown> = (
  props: AutocompleteProps<D>
) => JSX.Element;
