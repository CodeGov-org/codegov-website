import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import storyblok from '@storyblok/astro';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), 'STORYBLOK_TOKEN');

export default defineConfig({
  devToolbar: { enabled: false },
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
      bridge: {
        customParent: 'https://app.storyblok.com',
      },
      components: {
        page: 'storyblok/Page',
        grid: 'storyblok/Grid',
        rich_text: 'storyblok/RichText',
        heading_level_one: 'storyblok/headings/HeadingLevelOne',
      },
    }),
  ],
});
