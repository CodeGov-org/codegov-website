import { Theme } from '../types';

export function coerceTheme(theme: unknown): Theme {
  if (!isTheme(theme)) {
    throw new Error(`Invalid theme provided: "${theme}"`);
  }

  return theme;
}

export function isTheme(theme: unknown): theme is Theme {
  return theme === 'primary' || theme === 'success' || theme === 'error';
}
