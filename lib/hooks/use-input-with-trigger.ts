import { useMemo, useRef } from 'react';
import useState from 'react-use-batched-state';

type ReturnType = {
  readonly trigger: Record<string, unknown>;
  value: string;
};

export default function useInputWithTrigger(): ReturnType {
  const [input, setInput] = useState('');
  const [trigger, setTrigger] = useState({});

  const inputRef = useRef(input);
  const triggerRef = useRef(trigger);

  inputRef.current = input;
  triggerRef.current = trigger;

  return useMemo(function computePerceivedInput() {
    return Object.freeze({
      get trigger() {
        return triggerRef.current;
      },
      set value(str: string) {
        // Pass an object to update trigger.
        setInput(str);
        setTrigger({});
      },
      get value() {
        return inputRef.current;
      },
    });
  }, []);
}
