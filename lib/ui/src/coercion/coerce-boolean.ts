export type LooseBoolean =
  | boolean
  | 'true'
  | 'false'
  | 1
  | 0
  | '1'
  | '0'
  | ''
  | null
  | undefined;

const falseValues: LooseBoolean[] = ['false', false, '0', 0];
const trueValues: LooseBoolean[] = ['', 'true', true, '1', 1, null, undefined];

export function coerceBoolean(value: LooseBoolean): boolean {
  if (falseValues.includes(value)) {
    return false;
  }

  if (trueValues.includes(value)) {
    return true;
  }

  throw new Error(`Invalid boolean value: "${value}"`);
}
