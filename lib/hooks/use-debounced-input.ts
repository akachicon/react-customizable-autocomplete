import { useRef, useEffect, useMemo } from 'react';
import useState from 'react-use-batched-state';

type ReturnType = {
  readonly value: string;
};

export default function useDebouncedInput(input: string, ms = 150): ReturnType {
  const [debouncedInput, setDebouncedInput] = useState(input);
  const debouncedInputRef = useRef(debouncedInput);

  debouncedInputRef.current = debouncedInput;

  useEffect(
    function debounceInputVal() {
      const timer = setTimeout(setDebouncedInput, ms, input);

      return function removeTimer() {
        clearTimeout(timer);
      };
    },
    [input, ms]
  );

  return useMemo(function computeDebouncedInput() {
    return Object.freeze({
      get value() {
        return debouncedInputRef.current;
      },
    });
  }, []);
}
