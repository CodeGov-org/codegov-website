import type { StoryblokComponentType } from '@storyblok/astro';

export interface HeadingOneBlok
  extends StoryblokComponentType<'heading_level_one'> {
  text: string;
}
