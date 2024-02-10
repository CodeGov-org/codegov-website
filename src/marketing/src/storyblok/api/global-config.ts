import { useStoryblokApi } from '@storyblok/astro';
import type { GlobalConfigStory } from '../types/stories/global-config-story';
import type { LinkBlok, LinkCategoryBlok } from '../types/bloks/navigation';
import { env } from '../../environment';

function slugToHref(slug: string): string {
  return slug.startsWith('/') ? slug : `/${slug}`;
}

function normalizeLink(link: LinkBlok): LinkBlok {
  return {
    ...link,
    content: {
      ...link.content,
      cached_url: slugToHref(link.content.cached_url),
    },
  };
}

export async function getGlobalConfigStory(): Promise<GlobalConfigStory> {
  const storyblokApi = useStoryblokApi();

  const { data } = await storyblokApi.get('cdn/stories/global-config', {
    version: env.contentVersion,
  });

  const story: GlobalConfigStory = data.story;

  story.content.header_links = story.content.header_links.map(link => {
    if (isLinkCategory(link)) {
      return {
        ...link,
        children: link.children.map(normalizeLink),
      };
    }

    return normalizeLink(link);
  });

  story.content.footer_links = story.content.footer_links.map(link => ({
    ...link,
    children: link.children.map(normalizeLink),
  }));

  return data.story;
}

export function isLinkCategory(
  link: LinkCategoryBlok | LinkBlok,
): link is LinkCategoryBlok {
  return 'children' in link;
}
