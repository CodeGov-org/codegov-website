import { Meta, StoryObj } from '@storybook/html';
import { Theme } from '../../../types';

interface Args {
  content: string;
  theme: Theme;
}

const meta: Meta<Args> = {
  title: 'Atoms/Badges',
  argTypes: {
    content: {
      name: 'Content',
      control: { type: 'text' },
    },
  },
  args: {
    content: 'Approved',
  },
  render: args => `
    <cg-badge theme="${args.theme}">
      ${args.content}
    </cg-badge>
  `,
};

export default meta;

export const Primary: StoryObj<Args> = {
  args: {
    theme: 'primary',
  },
};

export const Success: StoryObj<Args> = {
  args: {
    theme: 'success',
  },
};

export const Error: StoryObj<Args> = {
  args: {
    theme: 'error',
  },
};
