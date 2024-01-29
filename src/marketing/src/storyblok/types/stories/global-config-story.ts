import type { ISbStoryData } from '@storyblok/astro';
import type { LinkBlok, LinkCategoryBlok } from '../bloks';

export type GlobalConfigStory = ISbStoryData<{
  header_links: Array<LinkCategoryBlok | LinkBlok>;
}>;
