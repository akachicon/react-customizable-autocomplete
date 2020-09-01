import { useRef } from 'react';
import type { MutableRefObject } from 'react';

type ImmutableRefObject<R> = Readonly<MutableRefObject<R>>;

export function useBoundRef<T>(dependency: T): ImmutableRefObject<T> {
  const ref = useRef<T>(dependency);
  ref.current = dependency;
  return ref as ImmutableRefObject<T>;
}
