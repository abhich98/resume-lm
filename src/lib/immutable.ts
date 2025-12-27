import { useRef } from 'react';

// Immutable array helpers
export function updateAt<T>(arr: T[], index: number, updater: (item: T) => T): T[] {
  return arr.map((item, i) => (i === index ? updater(item) : item));
}

// Generate a compact random id
function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Stable keys for arrays of objects using a WeakMap tied to object identity
export function useStableObjectKeys<T extends object>(items: T[]): string[] {
  const mapRef = useRef<WeakMap<object, string>>(new WeakMap());
  const idMap = mapRef.current;
  return items.map((item) => {
    let id = idMap.get(item as object);
    if (!id) {
      id = genId();
      idMap.set(item as object, id);
    }
    return id;
  });
}
