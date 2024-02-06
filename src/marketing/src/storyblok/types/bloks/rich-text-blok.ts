import type { ISbRichtext, StoryblokComponentType } from '@storyblok/astro';

export interface RichTextBlock extends StoryblokComponentType<'rich_text'> {
  text: ISbRichtext;
}
