import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'UI/Link Text Buttons',
  argTypes: {
    content: {
      control: { type: 'text' },
    },
  },
  args: {
    content: 'Click me!',
  },
  render: args => `
    <cg-link-text-btn href="#">
      ${args.content}
    </cg-link-text-btn>
  `,
};

export default meta;

export const Default: StoryObj = {};
