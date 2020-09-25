import React from 'react';
import AutoCompleteSearch from '@akachicon/react-customizable-autocomplete';
import {
  ErrorComponent,
  InputComponent,
  ListComponent,
  ListContainerComponent,
  MinChars,
  NoResultsComponent,
} from '@akachicon/react-customizable-autocomplete/components';

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

function App(): JSX.Element {
  return (
    <>
      <AutoCompleteSearch<null>
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
        errorComponent={ErrorComponent}
        inputComponent={InputComponent}
        listComponent={ListComponent}
        listContainerComponent={ListContainerComponent}
        minCharsComponent={MinChars}
        noResultsComponent={NoResultsComponent}
      />
    </>
  );
}

export default App;
