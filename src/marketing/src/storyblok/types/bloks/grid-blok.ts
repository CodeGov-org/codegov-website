import type { StoryblokComponentType } from '@storyblok/astro';
import type { ContentBlok } from './content-blok';

export interface GridBlok extends StoryblokComponentType<'grid'> {
  children: ContentBlok[];
}
