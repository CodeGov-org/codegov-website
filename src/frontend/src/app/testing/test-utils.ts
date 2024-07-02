import { TestScheduler } from 'rxjs/testing';

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

export function createTestScheduler(): TestScheduler {
  return new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
}
