import { type Dispatch, type SetStateAction, useState } from "react";

// Local state seeded from a prop. A document change to the prop (compared by `key`) resets it; local edits win in between.
export function useMirror<T>(value: T, key: unknown = value): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(value);
  const [seenKey, setSeenKey] = useState(key);
  if (!Object.is(seenKey, key)) {
    setSeenKey(key);
    setState(value);
  }
  return [state, setState];
}
