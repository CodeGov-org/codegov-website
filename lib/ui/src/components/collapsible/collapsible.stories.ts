import { Meta, StoryObj } from '@storybook/html';

type CollapsibleMeta = Meta;
type CollapsibleStory = StoryObj;

const meta: CollapsibleMeta = {
  title: 'UI/Collapsible',
  argTypes: {
    content: {
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

export const Default: CollapsibleStory = {};
