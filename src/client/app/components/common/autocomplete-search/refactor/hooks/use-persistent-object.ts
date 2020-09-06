import { useRef } from 'react';

export default function usePersistentObject<T extends Record<string, unknown>>(
  obj: T
): Readonly<T> {
  const initRender = useRef(true);
  const { current: persistentObj } = useRef(obj as Record<string, unknown>);

  if (initRender.current) {
    initRender.current = false;
    return persistentObj as T;
  }

  Object.entries(obj).forEach(function copyProp([key, val]) {
    persistentObj[key] = val;
  });

  return persistentObj as T;
}
