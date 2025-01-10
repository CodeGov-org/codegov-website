import { isNil } from '@cg/utils';

export function assertStringNonEmpty(value: string | undefined | null): string {
  if (isNil(value) || value.trim() === '') {
    throw new Error(
      'Empty string provided where a non-empty string was expected',
    );
  }

  return value;
}
