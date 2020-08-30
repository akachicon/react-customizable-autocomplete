import React from 'react';
import AutoCompleteSearch from '@app/components/common/autocomplete-search';
import stl from './app.scss';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const transformDataIntoText = (t: string) => t;
const getRandomSuggestions = (seed = Math.floor(Math.random() * 100)) => [
  {
    id: `${seed + 1}`,
    data: `id-${seed + 1}`,
    transformDataIntoText,
  },
  {
    id: `${seed + 2}`,
    data: `id-${seed + 2}`,
    transformDataIntoText,
  },
  {
    id: `${seed + 3}`,
    data: `id-${seed + 3}`,
    transformDataIntoText,
  },
  {
    id: `${seed + 4}`,
    data: `id-${seed + 4}`,
    transformDataIntoText,
  },
];
const onQuery = () => delay(200).then(() => getRandomSuggestions());

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
        onSubmit={() => console.log('passed onSubmit called')}
      />
    </>
  );
}

export default App;
