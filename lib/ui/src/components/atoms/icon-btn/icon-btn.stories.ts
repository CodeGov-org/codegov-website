import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Atoms/Icon Buttons',
  argTypes: {
    ariaLabel: {
      control: { type: 'text' },
    },
    disabled: {
      name: 'Disabled',
      control: { type: 'boolean' },
    },
  },
  args: {
    ariaLabel: 'Login',
    disabled: false,
  },
  render: args => `
    <cg-icon-btn label="${args.ariaLabel}" disabled="${args.disabled}">
      <cg-profile-icon></cg-profile-icon>
    </cg-icon-btn>
  `,
};

export default meta;

export const Default: StoryObj = {};
