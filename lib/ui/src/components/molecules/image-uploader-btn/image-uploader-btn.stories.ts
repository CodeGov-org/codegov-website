import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Molecules/Image Uploader Button',
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
    content: 'Select image',
    disabled: false,
    isLoading: false,
  },
  render: args => `
    <cg-image-uploader-btn
      is-loading="${args.isLoading}"
      disabled="${args.disabled}"
    >
      ${args.content}
    </cg-image-uploader-btn>
  `,
};

export default meta;

export const Default: StoryObj = {};
