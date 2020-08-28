type Debounce = (
  f: (...args: unknown[]) => unknown,
  ms?: number,
  immediate?: boolean
) => (this: unknown, ...args: unknown[]) => void;

export const debounce: Debounce = (func, ms = 100, immediate = true) => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function debouncedFunc(this: unknown, ...args: unknown[]) {
    if (timer) {
      clearTimeout(timer);

      timer = setTimeout(() => {
        timer = null;
        func.call(this, ...args);
      }, ms);

      return;
    }

    timer = setTimeout(() => {
      timer = null;
      if (!immediate) {
        func.call(this, ...args);
      }
    }, ms);

    if (immediate) {
      func.call(this, ...args);
    }
  };
};
