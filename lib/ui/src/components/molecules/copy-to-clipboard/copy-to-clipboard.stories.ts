import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Molecules/Copy To Clipboard',
  argTypes: {
    content: {
      name: 'Content',
      value: { type: 'text' },
    },
    type: {
      name: 'Type',
      control: {
        type: 'select',
        labels: { text: 'Text', textarea: 'Text Area' },
      },
      options: ['text', 'textarea'],
    },
  },
  args: {
    content: 'Super secret code',
    type: 'text',
  },
  render: args => `
    <cg-copy-to-clipboard
      value="${args.content}"
      type="${args.type ?? 'text'}"
    ></cg-copy-to-clipboard>
  `,
};

export default meta;

export const Default: StoryObj = {};
