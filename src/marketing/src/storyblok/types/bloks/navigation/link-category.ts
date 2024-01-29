import type { StoryblokComponentType } from '@storyblok/astro';
import type { LinkBlok } from './link';

export interface LinkCategoryBlok
  extends StoryblokComponentType<'link_category'> {
  title: string;
  children: LinkBlok[];
}
