import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Molecules/Copy To Clipboard',
  argTypes: {
    content: {
      value: { type: 'text' },
    },
  },
  args: {
    value: 'Super secret code',
  },
  render: args => `
    <cg-copy-to-clipboard value="${args.value}">
  `,
};

export default meta;

export const Default: StoryObj = {};
