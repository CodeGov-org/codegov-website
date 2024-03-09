import { Meta, StoryObj } from '@storybook/html';

type TextBtnMeta = Meta;
type TextBtnStory = StoryObj;

const meta: TextBtnMeta = {
  title: 'UI/Text Buttons',
  argTypes: {
    content: {
      control: { type: 'text' },
    },
  },
  args: {
    content: 'Click me!',
  },
  render: args => `
    <cg-text-btn>${args.content}</cg-text-btn>
  `,
};

export default meta;

export const Default: TextBtnStory = {};
