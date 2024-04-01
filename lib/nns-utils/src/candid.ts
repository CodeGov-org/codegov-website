import { nonNullish } from '@dfinity/utils';

export function optional<T>(type: T | null | undefined): [] | [T] {
  return nonNullish(type) ? [type] : [];
}
