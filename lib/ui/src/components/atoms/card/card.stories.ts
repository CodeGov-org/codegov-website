import { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Atoms/Cards',
  argTypes: {
    title: {
      name: 'Title',
      control: { type: 'text' },
    },
    content: {
      name: 'Content',
      control: { type: 'text' },
    },
  },
  args: {
    title: 'Hello, World!',
    content: 'How are you today?',
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
