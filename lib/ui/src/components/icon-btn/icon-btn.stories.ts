import { Meta, StoryObj } from '@storybook/html';
import { IconBtnProps } from './icon-btn';

type IconBtnMeta = Meta<IconBtnProps>;
type IconBtnStory = StoryObj<IconBtnProps>;

const meta: IconBtnMeta = {
  title: 'UI/Icon Buttons',
  argTypes: {
    label: {
      control: { type: 'text' },
    },
  },
  args: {
    label: 'Login',
  },
  render: args => `
    <cg-icon-btn label="${args.label}">
      <cg-profile-icon/>
    </cg-icon-btn>
  `,
};

export default meta;

export const Default: IconBtnStory = {};
