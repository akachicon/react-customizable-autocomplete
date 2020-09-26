import React from 'react';
import AutocompleteSearch from '@akachicon/react-customizable-autocomplete';
import type {
  ErrorComponentType,
  InputComponentType,
  MinCharsComponentType,
  NoResultsComponentType,
} from '@akachicon/react-customizable-autocomplete/types';
import List from './list';
import ListContainer from './list-container';
import type { Data } from './types';

const Error: ErrorComponentType = function ErrorComponent() {
  return <>Fetch error occurred</>;
};

const Input: InputComponentType = function InputComponent({ inputProps }) {
  return <input {...inputProps} />;
};

const MinChars: MinCharsComponentType = function MinCharsComponent() {
  return <>Start typing to see results</>;
};

const NoResults: NoResultsComponentType = function NoResultsComponent() {
  return <>No results for your query</>;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getRandomSuggestions = (seed = Math.floor(Math.random() * 100)) => {
  const arr = new Array(20)
    .join('_')
    .split('')
    .map((_, i) => ({
      id: `${seed + i}`,
      text: `id-${seed + i}`,
      data: null,
    }));

  return arr;
};
const onQuery = () => delay(1500).then(() => getRandomSuggestions());

function BasicExample(): JSX.Element {
  return (
    <>
      <AutocompleteSearch<Data>
        onQuery={() => onQuery()}
        onQueryBecomesObsolete={(queryPromise) =>
          console.log('query becomes obsolete')
        }
        onSubmit={({ id, query }) =>
          console.log(
            `consume submit: \nid: ${
              id === null ? 'null' : id
            } \nquery: ${query}\n`
          )
        }
        debounceMs={1000}
        errorComponent={Error}
        inputComponent={Input}
        listComponent={List}
        listContainerComponent={ListContainer}
        minCharsComponent={MinChars}
        noResultsComponent={NoResults}
      />
    </>
  );
}

export default BasicExample;
