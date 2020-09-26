import { useMemo, useRef } from 'react';
import useState from 'react-use-batched-state';

type ReturnType = {
  value: string;
};

export default function usePerceivedInput(): ReturnType {
  const [input, setInput] = useState('');
  const inputRef = useRef(input);

  inputRef.current = input;

  return useMemo(function computePerceivedInput() {
    return Object.freeze({
      set value(str: string) {
        setInput(str);
      },
      get value() {
        return inputRef.current;
      },
    });
  }, []);
}
