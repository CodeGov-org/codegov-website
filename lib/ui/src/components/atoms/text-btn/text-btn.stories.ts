import { Meta, StoryObj } from '@storybook/html';
import { Theme } from '../../../types';

interface Args {
  content: string;
  theme: Theme;
}

const meta: Meta<Args> = {
  title: 'Atoms/Text Buttons',
  argTypes: {
    content: {
      name: 'Content',
      control: { type: 'text' },
    },
  },
  args: {
    content: 'Click me!',
  },
  render: args => `
    <cg-text-btn theme="${args.theme}">
      ${args.content}
    </cg-text-btn>
  `,
};

export default meta;

export const Default: StoryObj<Args> = {};

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
