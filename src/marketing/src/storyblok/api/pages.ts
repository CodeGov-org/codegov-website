import { useStoryblokApi } from '@storyblok/astro';
import type { ISbLinks, ISbLink } from 'storyblok-js-client';
import type { PageStory } from '../types';
import type { ApiResponse } from './api-response';

type ApiLinksResponse = ApiResponse<ISbLinks>;

async function getCdnLinks(): Promise<ISbLink[]> {
  const storyblokApi = useStoryblokApi();

  const res = (await storyblokApi.get('cdn/links', {
    version: 'draft',
  })) as ApiLinksResponse;

  return Object.values(res.data.links ?? {});
}

export async function getPageStoryBySlug(
  slug: string | undefined,
): Promise<PageStory> {
  const storyblokApi = useStoryblokApi();

  const { data } = await storyblokApi.get(
    `cdn/stories/${slug === undefined ? 'home' : slug}`,
    {
      version: 'draft',
    },
  );

  return data.story;
}

export async function getAllPageStorySlugs(): Promise<
  Array<string | undefined>
> {
  const links = await getCdnLinks();

  return links
    .filter(({ is_folder }) => !is_folder)
    .map(link => (link.slug === 'home' ? undefined : link.slug));
}
