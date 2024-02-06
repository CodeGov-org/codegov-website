import type { ContentBlok } from './content-blok';
import type { SeoMetadata } from '../seo-metadata';
import type { StoryblokComponentType } from '@storyblok/astro';

export interface PageBlokContent {
  body?: ContentBlok[];
  seo_metadata?: SeoMetadata;
}

export type PageBlok = StoryblokComponentType<'page'> & PageBlokContent;
