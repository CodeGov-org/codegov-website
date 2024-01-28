import { useStoryblokApi, type ISbResult } from '@storyblok/astro';
import { type ISbLinks, type ISbLink } from 'storyblok-js-client';
import type { PageStory } from './types';

export type ApiResponse<T> = Omit<ISbResult, 'data'> & {
  data: T;
};

export type ApiLinksResponse = ApiResponse<ISbLinks>;

export interface ChildLink {
  title: string;
  href: string;
}

export interface LinkFolder {
  title: string;
  children: ChildLink[];
}

export type Link = LinkFolder | ChildLink;

export function isLinkFolder(
  link: Link | undefined | null,
): link is LinkFolder {
  return link !== undefined && link !== null && 'children' in link;
}

function slugToHref(slug: string): string {
  return slug.startsWith('/') ? slug : `/${slug}`;
}

async function getCdnLinks(): Promise<ISbLink[]> {
  const storyblokApi = useStoryblokApi();

  const res: ApiLinksResponse = (await storyblokApi.get('cdn/links', {
    version: 'draft',
  })) as ApiLinksResponse;

  return Object.values(res.data.links ?? {});
}

export async function getStoryBlokLinks() {
  const storyBlokLinks = await getCdnLinks();

  const mappedLinks = storyBlokLinks.reduce<Record<number, Link>>(
    (acc, link) => {
      if (link.slug === 'home') {
        return acc;
      }

      if (!link.name || !link.slug || !link.id) {
        throw new Error('Missing properties on link', { cause: link });
      }

      if (link.is_folder && !link.parent_id) {
        const existingItem = acc[link.id];
        const existingChildren = isLinkFolder(existingItem)
          ? existingItem.children
          : [];

        acc[link.id] = {
          title: link.name,
          href: link.slug,
          children: existingChildren,
        };
      } else if (link.parent_id) {
        const existingParent = acc[link.parent_id];
        const parent: LinkFolder = isLinkFolder(existingParent)
          ? existingParent
          : {
              title: '',
              children: [],
            };

        parent.children.push({
          title: link.name,
          href: slugToHref(link.slug),
        });
      } else if (!link.parent_id) {
        acc[link.id] = {
          title: link.name,
          href: slugToHref(link.slug),
        };
      } else {
        throw new Error('Received invalid link', { cause: link });
      }

      return acc;
    },
    {},
  );

  return Object.values(mappedLinks);
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
