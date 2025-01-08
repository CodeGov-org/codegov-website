import { type Preview } from '@storybook/html';
import { defineCustomElements } from '../loader';
import '@cg/styles/global.scss';

defineCustomElements();

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      exclude: ['theme'],
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
