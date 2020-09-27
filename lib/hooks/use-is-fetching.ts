import { useRef } from 'react';
import debug from '../debug';

type Args = {
  gteMinChars: boolean;
  isRequestInFlight: boolean;
  inputValue: string;
  debouncedInputValue: string;
};

export default function useIsFetching({
  gteMinChars,
  isRequestInFlight,
  inputValue,
  debouncedInputValue,
}: Args): boolean {
  // The time after a user changed the input but before the request
  // was actually sent is also considered as 'fetching'. To detect
  // the case we can check equality between inputValue and
  // debouncedInputValue (the latter triggers the request). The
  // problem is, the check is truthy right after debouncedInputValue
  // changed but before the request (triggered by debouncedInputValue
  // in an effect) was sent. To work around this problem we check
  // if new debouncedInputValue differs from the previous when the
  // inputs become matching. If true, the request will be sent
  // and 'fetching' should stay true.

  const prevInputMatch = useRef(false);
  const prevDebouncedInput = useRef('');

  const inputMatch = inputValue === debouncedInputValue;
  let willTriggerRequest = false;

  // Inputs didn't match and now they do. This is possible in two scenarios:
  //
  // 1. User starts typing something and then removes typed characters, so
  // the input stays the same as before the typing. This will result in
  // inputValue change, but due to debounce debouncedInputValue will not
  // change.
  //
  // 2. User types something and then stops. After debounce time
  // debouncedInputValue will get update and become aligned with
  // inputValue.
  const newInputMatch = inputMatch !== prevInputMatch.current && inputMatch;

  // True only in the second case.
  const newDebouncedInput = debouncedInputValue !== prevDebouncedInput.current;

  if (newInputMatch && newDebouncedInput) {
    willTriggerRequest = true;
  }

  prevInputMatch.current = inputMatch;
  prevDebouncedInput.current = debouncedInputValue;

  const isFetching =
    gteMinChars && (isRequestInFlight || !inputMatch || willTriggerRequest);

  debug.log('isFetching', String(isFetching));

  return isFetching;
}
