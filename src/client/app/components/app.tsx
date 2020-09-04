import React from 'react';
import AutoCompleteSearch from '@app/components/common/autocomplete-search';
import stl from './app.scss';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const transformDataIntoText = (t: string) => t;
const getRandomSuggestions = (seed = Math.floor(Math.random() * 100)) =>
  Array(20)
    .join('x')
    .split('')
    .map((x, i) => ({
      id: `${seed + i}`,
      data: `id-${seed + i}`,
      transformDataIntoText,
    }));
const onQuery = () => delay(1500).then(() => getRandomSuggestions());

function App(): JSX.Element {
  return (
    <>
      <AutoCompleteSearch<string>
        label="search"
        name="github-company-search"
        onQuery={() => {
          console.log('onQuery');
          return onQuery();
        }}
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
        suggestionsLimit={20}
      />
    </>
  );
}

export default App;
