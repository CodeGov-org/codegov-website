import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Atoms/Radio Inputs',
  render: () => `
    <cg-radio-input id="yes" value="yes" name="choice">
      Yes
    </cg-radio-input>

    <cg-radio-input id="no" value="no" name="choice">
      No
    </cg-radio-input>

    <cg-radio-input id="maybe" value="maybe" name="choice">
      Maybe
    </cg-radio-input>
  `,
};

export default meta;

export const Default: StoryObj = {};
