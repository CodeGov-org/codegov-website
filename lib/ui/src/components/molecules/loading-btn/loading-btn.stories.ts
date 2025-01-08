import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Molecules/Loading Button',
  argTypes: {
    content: {
      name: 'Content',
      control: { type: 'text' },
    },
    disabled: {
      name: 'Disabled',
      control: { type: 'boolean' },
    },
    isLoading: {
      name: 'Loading',
      control: { type: 'boolean' },
    },
  },
  args: {
    content: 'Save',
    disabled: false,
    isLoading: true,
  },
  render: args => `
    <cg-loading-btn
      is-loading="${args.isLoading}"
      disabled="${args.disabled}"
    >
      ${args.content}
    </cg-loading-btn>
  `,
};

export default meta;

export const Default: StoryObj = {};
