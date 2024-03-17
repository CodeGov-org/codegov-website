import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Atoms/Icon Buttons',
  argTypes: {
    ariaLabel: {
      control: { type: 'text' },
    },
  },
  args: {
    ariaLabel: 'Login',
  },
  render: args => `
    <cg-icon-btn label="${args.ariaLabel}">
      <cg-profile-icon/>
    </cg-icon-btn>
  `,
};

export default meta;

export const Default: StoryObj = {};
