import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Atoms/Cards',
  args: {
    title: 'Hello, World!',
    content: 'How are you today?',
  },
  argTypes: {
    title: {
      control: { type: 'text' },
    },
    content: {
      control: { type: 'text' },
    },
  },
  render: args => `
    <cg-card>
      <div slot="cardTitle">${args.title}</div>
      <div slot="cardContent">${args.content}</div>
    </cg-card>
  `,
};

export default meta;

export const Default: StoryObj = {};
