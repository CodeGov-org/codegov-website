import { Meta, StoryObj } from '@storybook/html';

type FooterMeta = Meta;
type FooterStory = StoryObj;

const meta: FooterMeta = {
  title: 'UI/Footer',
  args: {
    mainText: 'This is footer content',
    copyright: '© 2024 CodeGov™. All Rights Reserved.',
  },
  argTypes: {
    mainText: {
      control: { type: 'text' },
    },
    copyright: {
      control: { type: 'text' },
    },
  },
  render: args => `
    <cg-footer>
      <div slot="footerMain">${args.mainText}</div>
      <div slot="footerCopyright">${args.copyright}</div>
    </cg-footer>
  `,
};

export default meta;
export const Default: FooterStory = {};
