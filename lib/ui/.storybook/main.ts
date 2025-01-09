import { type StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-essentials',
      options: {
        backgrounds: false,
        measure: false,
        outline: false,
      },
    },
  ],
  async viteFinal(config, { configType }) {
    const { mergeConfig } = await import('vite');

    if (configType !== 'DEVELOPMENT') {
      return config;
    }

    return mergeConfig(config, {
      build: {
        // this is set to 'dist' by default which causes hot-reloading for stencil components to break
        // see: https://vitejs.dev/config/server-options.html#server-watch
        // setting it to anything other than dist fixes the issue
        outDir: 'dist-vite',
      },
    });
  },
};

export default config;
