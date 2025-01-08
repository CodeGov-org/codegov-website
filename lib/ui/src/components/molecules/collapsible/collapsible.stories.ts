import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Molecules/Collapsible',
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
    title: 'Click me?',
    content: 'Peek a boo!',
  },
  render: args => `
    <cg-collapsible>
      <div slot="collapsibleTrigger">${args.title}</div>
      <div slot="collapsibleContent">${args.content}</div>
    </cg-collapsible>
  `,
};

export default meta;

export const Default: StoryObj = {};
