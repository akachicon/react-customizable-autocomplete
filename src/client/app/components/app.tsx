import React from 'react';
import AutoCompleteSearch from '@app/components/common/autocomplete-search';
import stl from './app.scss';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const transformDataIntoText = (t: string) => t;
const getRandomSuggestions = (seed = Math.floor(Math.random() * 100)) =>
  Array(8)
    .join('x')
    .split('')
    .map((x, i) => ({
      id: `${seed + i}`,
      data: `id-${seed + i}`,
      transformDataIntoText,
    }));
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
        suggestionsLimit={7}
      />
    </>
  );
}

export default App;
