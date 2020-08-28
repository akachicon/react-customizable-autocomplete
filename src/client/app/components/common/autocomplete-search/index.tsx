import React, { useState, useRef, useCallback } from 'react';

export type Props = {
  label: string;
  name?: string;
  autoFocus?: boolean;
  onSubmit: () => void;
};

export default function AutoCompleteSearch({
  label,
  name = 'q',
  autoFocus = false,
  onSubmit,
}: Props): JSX.Element {
  const [inputVal, setInputVal] = useState('');
  const [loader, setLoader] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onChange = useCallback(
    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
      setInputVal(e.currentTarget.value);
    },
    [setInputVal]
  );
  const onFormSubmit = useCallback(
    function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setLoader(false);
      onSubmit();
    },
    [onSubmit]
  );

  return (
    <form onSubmit={onFormSubmit}>
      <label>
        {label}
        <input
          ref={inputRef}
          name={name}
          value={inputVal}
          onChange={onChange}
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </label>
      {loader && <span>loading</span>}
    </form>
  );
}
