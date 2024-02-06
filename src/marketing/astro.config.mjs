import dotenv from 'dotenv';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import storyblok from '@storyblok/astro';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { loadEnv } from 'vite';
import netlify from '@astrojs/netlify';

const env = loadEnv('', process.cwd(), 'STORYBLOK_TOKEN');

dotenv.config({
  debug: true,
  path: '../../.env',
});

const dfxNetwork = process.env.DFX_NETWORK ?? 'local';
const isMainnet = dfxNetwork === 'ic';
const isStaging = dfxNetwork === 'staging';

export default defineConfig({
  devToolbar: { enabled: false },
  output: isStaging ? 'server' : 'static',
  adapter: isStaging ? netlify() : undefined,
  vite: {
    plugins: [basicSsl()],
    server: {
      https: true,
    },
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    storyblok({
      accessToken: env.STORYBLOK_TOKEN,
      apiOptions: {
        region: 'us',
      },
      bridge: !isMainnet,
      components: {
        global_config: 'storyblok/GlobalConfig',
        page: 'storyblok/Page',
        grid: 'storyblok/Grid',
        rich_text: 'storyblok/RichText',
        heading_level_one: 'storyblok/headings/HeadingLevelOne',
      },
    }),
  ],
});
