import React from 'react';
import AutoCompleteSearch from '@app/components/common/autocomplete-search';
import stl from './app.scss';

function App(): JSX.Element {
  return (
    <>
      <AutoCompleteSearch
        label="search"
        name="github-company-search"
        onQuery={() => Promise.resolve([])}
        onSubmit={() => console.log('passed onSubmit called')}
      />
    </>
  );
}

export default App;
