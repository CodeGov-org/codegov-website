import type { StoryblokComponentType } from '@storyblok/astro';

export interface LinkBlok extends StoryblokComponentType<'link'> {
  title: string;
  content: {
    id: string;
    url: string;
    linktype: string;
    fieldtype: string;
    cached_url: string;
  };
}
