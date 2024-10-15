import { isNil } from './nil';

export function toCandidOpt<T>(value?: T | undefined | null): [] | [T] {
  return value ? [value] : [];
}

export function fromCandidOpt<T>(value: [] | [T] | undefined | null): T | null {
  if (isNil(value)) {
    return null;
  }

  const [innerValue] = value;

  return isNil(innerValue) ? null : innerValue;
}

export function fromCandidOptDate(value: [] | [string]): Date | null {
  const [innerValue] = value;

  return isNil(innerValue) ? null : fromCandidDate(innerValue);
}

export function fromCandidDate(value: string): Date {
  return new Date(Number(value));
}
