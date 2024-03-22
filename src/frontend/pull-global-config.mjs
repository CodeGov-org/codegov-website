import dotenv from 'dotenv';
import StoryblokClient from 'storyblok-js-client';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({
  debug: true,
  path: '.env',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dfxNetwork = process.env.DFX_NETWORK ?? 'local';
const isMainnet = dfxNetwork === 'ic';

const marketingCanisterId = process.env.CANISTER_ID_MARKETING ?? '';
const marketingUrl = isMainnet
  ? `https://${marketingCanisterId}.icp0.io`
  : `http://${marketingCanisterId}.localhost:8080`;

const storyblok = new StoryblokClient({
  accessToken: process.env.STORYBLOK_TOKEN,
  region: 'us',
});

const {
  data: { story },
} = await storyblok.get('cdn/stories/global-config', {
  version: isMainnet ? 'published' : 'draft',
});

const globalConfig = {
  applyLink: `${marketingUrl}${slugToHref(
    story.content.apply_link.cached_url,
  )}`,
  headerLinks: story.content.header_links.map(link => {
    if (isLinkCategory(link)) {
      return {
        title: link.title,
        children: link.children.map(normalizeLink),
      };
    }

    return normalizeLink(link);
  }),
  footerLinks: story.content.footer_links.map(link => ({
    title: link.title,
    children: link.children.map(normalizeLink),
  })),
};

const targetDir = resolve(__dirname, 'src');
const filePath = resolve(targetDir, 'global-config.json');

await mkdir(targetDir, { recursive: true });
await writeFile(filePath, JSON.stringify(globalConfig));

function isLinkCategory(link) {
  return 'children' in link;
}

function slugToHref(slug) {
  return slug.startsWith('/') ? slug : `/${slug}`;
}

function normalizeLink(link) {
  return {
    title: link.title,
    url: `${marketingUrl}${slugToHref(link.content.cached_url)}`,
  };
}
