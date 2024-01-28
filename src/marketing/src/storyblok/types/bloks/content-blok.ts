import type { RichTextBlock } from './rich-text-blok';
import type { HeadingOneBlok } from './heading-blok';
import type { GridBlok } from './grid-blok';

export type ContentBlok = RichTextBlock | HeadingOneBlok | GridBlok;
