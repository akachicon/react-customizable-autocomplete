import { useMemo } from 'react';
import type {
  AutocompleteSearchProps,
  SuggestionResult,
} from '../types/autocomplete-search-props';
import useIdentPropsCache from './use-ident-props-cache';
import useSuggestionList from './use-suggestion-list';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dependencies<SuggestionData = any> = Pick<
  Required<AutocompleteSearchProps<SuggestionData>>,
  | 'minCharsRequired'
  | 'minCharsRequiredMessage'
  | 'minCharsRequiredComponent'
  | 'queryErrorMessage'
  | 'queryErrorComponent'
  | 'suggestionComponent'
  | 'noResultsMessage'
  | 'noResultsComponent'
> & {
  suggestions: SuggestionResult<SuggestionData>[] | null;
  suggestionsExist: boolean;
  suggestionsHaveLength: boolean;
  selectedSuggestionId: string | null;
  showQueryError: boolean;
  debouncedInputValLength: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useSuggestionContainerContent<SuggestionData = any>({
  minCharsRequired,
  minCharsRequiredMessage,
  minCharsRequiredComponent: MinCharsRequired,
  queryErrorMessage,
  queryErrorComponent: QueryError,
  suggestionComponent: Suggestion,
  noResultsMessage,
  noResultsComponent: NoResults,
  suggestions,
  suggestionsExist,
  suggestionsHaveLength,
  selectedSuggestionId,
  showQueryError,
  debouncedInputValLength,
}: Dependencies<SuggestionData>): JSX.Element {
  const getCachedOnProps = useIdentPropsCache();
  const getSuggestionList = useSuggestionList<SuggestionData>({
    suggestions,
    Suggestion,
  });

  const minCharsCheckPassed = useMemo(
    function calcMinCharsCheck() {
      return debouncedInputValLength >= minCharsRequired;
    },
    [debouncedInputValLength, minCharsRequired]
  );

  return useMemo(
    function calcContainerComp() {
      if (!minCharsCheckPassed) {
        return getCachedOnProps(MinCharsRequired, {
          text: minCharsRequiredMessage,
        });
      }

      if (showQueryError) {
        return getCachedOnProps(QueryError, { text: queryErrorMessage });
      }

      if (suggestionsExist && suggestionsHaveLength) {
        return getSuggestionList(selectedSuggestionId);
      }

      if (suggestionsExist && !suggestionsHaveLength) {
        return getCachedOnProps(NoResults, { text: noResultsMessage });
      }

      // The case where we are past min chars but
      // the query is not resolved/rejected.
      return getCachedOnProps(MinCharsRequired, {
        text: minCharsRequiredMessage,
      });
    },
    [
      minCharsRequiredMessage,
      MinCharsRequired,
      queryErrorMessage,
      QueryError,
      noResultsMessage,
      NoResults,
      suggestionsExist,
      suggestionsHaveLength,
      selectedSuggestionId,
      showQueryError,
      getCachedOnProps,
      minCharsCheckPassed,
      getSuggestionList,
    ]
  );
}
