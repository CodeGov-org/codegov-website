import type { RichTextBlock } from './rich-text-blok';
import type { HeadingOneBlok } from './heading-blok';
import type { GridBlok } from './grid-blok';
import type { LinkBlok, LinkCategoryBlok } from './navigation';

export type ContentBlok =
  | RichTextBlock
  | HeadingOneBlok
  | GridBlok
  | LinkBlok
  | LinkCategoryBlok;
