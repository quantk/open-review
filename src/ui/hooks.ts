import { useState } from "react";

export function useStoredBoolean(key: string, fallback: boolean): [boolean, (next: boolean) => void] {
  const [value, setValue] = useState(() => window.localStorage.getItem(key) === "1" || (window.localStorage.getItem(key) == null && fallback));
  function update(next: boolean) {
    setValue(next);
    window.localStorage.setItem(key, next ? "1" : "0");
  }
  return [value, update];
}
