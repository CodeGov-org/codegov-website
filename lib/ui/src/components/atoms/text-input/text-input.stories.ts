import { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Atoms/Text Inputs',
  argTypes: {
    content: {
      name: 'Content',
      control: { type: 'text' },
    },
  },
  args: {
    content: '',
  },
  render: args => `
    <cg-text-input placeholder="Write something here" value="${args.content}" />
  `,
};

export default meta;

export const Default: StoryObj = {};
