import { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Atoms/Link Text Buttons',
  argTypes: {
    content: {
      name: 'Content',
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
