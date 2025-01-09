import { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Atoms/Radio Inputs',
  argTypes: {
    disabled: {
      name: 'Disabled',
      control: { type: 'boolean' },
    },
  },
  args: {
    disabled: false,
  },
  render: args => `
    <cg-radio-input
      id="yes"
      value="yes"
      name="choice"
      disabled="${args.disabled}"
    >
      Yes
    </cg-radio-input>

    <cg-radio-input
      id="no"
      value="no"
      name="choice"
      disabled="${args.disabled}"
    >
      No
    </cg-radio-input>

    <cg-radio-input
      id="maybe"
      value="maybe"
      name="choice"
      disabled="${args.disabled}"
    >
      Maybe
    </cg-radio-input>
  `,
};

export default meta;

export const Default: StoryObj = {};
