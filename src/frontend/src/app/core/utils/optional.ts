export function optional<T>(value: T | undefined | null): [] | [T] {
  return value ? [value] : [];
}
