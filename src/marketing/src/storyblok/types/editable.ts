import type { SbBlokKeyDataTypes } from '@storyblok/astro';

export type EditableBlok<T> = T & Record<string, SbBlokKeyDataTypes>;

export function editable<T>(blok: T): EditableBlok<T> {
  return blok as EditableBlok<T>;
}
