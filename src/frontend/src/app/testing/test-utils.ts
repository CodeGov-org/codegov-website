export function defineProp<T, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K],
): void {
  Object.defineProperty(obj, key, {
    value,
    writable: false,
  });
}
