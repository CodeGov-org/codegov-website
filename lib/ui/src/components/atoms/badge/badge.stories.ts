import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Atoms/Badges',
  args: {
    content: 'Approved',
  },
  argTypes: {
    content: {
      control: { type: 'text' },
    },
    theme: {
      control: { type: 'select' },
      options: ['primary', 'success', 'error'],
    },
  },
  render: args => `
    <cg-badge theme="${args.theme ?? 'primary'}">
      ${args.content}
    </cg-badge>
  `,
};

export default meta;

export const Default: StoryObj = {
  args: {
    theme: 'primary',
  },
};
