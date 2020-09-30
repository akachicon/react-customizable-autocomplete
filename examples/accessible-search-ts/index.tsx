import React, { useCallback } from 'react';
import AutocompleteSearch from 'react-customizable-autocomplete';
import type {
  ErrorComponentType,
  InputComponentType,
  MinCharsComponentType,
  NoResultsComponentType,
  OnQuerySignature,
  OnSubmitSignature,
} from 'react-customizable-autocomplete/types';
import api from './api';
import List from './list';
import ListContainer from './list-container';
import { comboboxId, textboxId, listboxId, labelId } from './constants';
import stl from './styles.scss';
import type { Data } from './types';

const messageClassName = [
  stl['suggestions__list'],
  stl['suggestions__text'],
].join(' ');

const Error: ErrorComponentType = function ErrorComponent() {
  return <div className={messageClassName}>Fetch error occurred</div>;
};

const Input: InputComponentType = function InputComponent({
  inputProps,
  selectedItem,
  isOpen,
  reset,
}) {
  const resetAndFocusInput = useCallback(
    function resetAndFocusInput(e: React.SyntheticEvent) {
      e.preventDefault();
      reset();
      inputProps.ref.current?.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reset, inputProps.ref.current]
  );

  const resetAndFocusOnEnter = useCallback(
    function resetAndFocusOnEnter(e: React.KeyboardEvent) {
      if (e.key !== 'Enter') {
        return;
      }
      resetAndFocusInput(e);
    },
    [resetAndFocusInput]
  );

  return (
    <div
      id={comboboxId}
      className={stl['input']}
      role="combobox"
      aria-expanded={isOpen}
      aria-owns={listboxId}
      aria-haspopup="listbox"
    >
      <input
        id={textboxId}
        className={stl['input__textbox']}
        maxLength={512}
        aria-multiline={false}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={selectedItem?.id ?? ''}
        {...inputProps}
      />
      <button
        className={stl['input__reset-button']}
        type="reset"
        onMouseDown={resetAndFocusInput}
        onKeyPress={resetAndFocusOnEnter}
      />
    </div>
  );
};

const MinChars: MinCharsComponentType = function MinCharsComponent() {
  return <div className={messageClassName}>Start typing to see results</div>;
};

const NoResults: NoResultsComponentType = function NoResultsComponent() {
  return <div className={messageClassName}>No results for your query</div>;
};

const onQuery: OnQuerySignature<Data> = (q) =>
  api.query(q, 100).then((data) =>
    data.slice(0, 7).map((dataEntry) => ({
      text: dataEntry.name,
      id: dataEntry.id,
    }))
  );

const onSubmit: OnSubmitSignature = () => undefined;

function AccessibleSearch(): JSX.Element {
  return (
    <>
      <label id={labelId} htmlFor={textboxId}>
        Search name:
      </label>
      <AutocompleteSearch<Data>
        onQuery={onQuery}
        onSubmit={onSubmit}
        minCharsRequired={1}
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

export default AccessibleSearch;
