import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Molecules/Image Uploader Button',
  render: () => `
    <cg-image-uploader-btn>
      Select image(s)
    </cg-image-uploader-btn>
  `,
};

export default meta;

export const Default: StoryObj = {};
