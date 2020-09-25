import React, { useCallback } from 'react';

type KeyMap = Record<string, React.KeyboardEventHandler<HTMLInputElement>>;

export default function useKeyDown(
  keyMap: KeyMap
): React.KeyboardEventHandler<HTMLInputElement> {
  return useCallback(
    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      const acceptedKeys = Object.keys(keyMap);

      if (!acceptedKeys.includes(e.key)) return;

      e.preventDefault();
      keyMap[e.key](e);
    },
    [keyMap]
  );
}
