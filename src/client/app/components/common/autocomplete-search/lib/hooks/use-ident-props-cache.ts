import { createElement, useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericFC = (...args: any[]) => JSX.Element;

type PropCombinationsMap = Record<string, JSX.Element>;

type CacheHookReturnType = (
  componentIdent: GenericFC,
  props: Record<string, unknown>
) => JSX.Element;

export default function useIdentPropsCache(): CacheHookReturnType {
  const cache = useRef(new WeakMap<GenericFC, PropCombinationsMap>());

  return useCallback(function getCached(
    componentIdent: GenericFC,
    props: Record<string, unknown>
  ) {
    const identCombinationsMap = cache.current.get(componentIdent);
    const stringifiedProps = JSON.stringify(props);

    if (identCombinationsMap) {
      const cachedComponent = identCombinationsMap[stringifiedProps];

      if (cachedComponent) {
        return cachedComponent;
      }

      return (identCombinationsMap[stringifiedProps] = createElement(
        componentIdent,
        props
      ));
    }

    const cachedComponent = createElement(componentIdent, props);
    cache.current.set(componentIdent, {
      [stringifiedProps]: cachedComponent,
    });
    return cachedComponent;
  },
  []);
}
