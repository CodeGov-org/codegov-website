import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'UI/Footer',
  args: {
    copyright: '© 2024 CodeGov™. All Rights Reserved.',
  },
  argTypes: {
    copyright: {
      control: { type: 'text' },
    },
  },
  render: args => `
    <cg-footer id="footer">
      <div slot="footerCopyright">${args.copyright}</div>
    </cg-footer>

    <script>
      document.getElementById('footer').links = [
        {
          title: 'Section #1',
          children: [
            {
              title: 'URL #1',
              url: '#',
            },
            {
              title: 'URL #2',
              url: '#',
            }
          ]
        },
        {
          title: 'Section #3',
          children: [
            {
              title: 'URL #3',
              url: '#',
            },
            {
              title: 'URL #4',
              url: '#',
            },
            {
              title: 'URL #5',
              url: '#',
            }
          ]
        },
        {
          title: 'Section #3',
          children: [
            {
              title: 'URL #6',
              url: '#',
            },
            {
              title: 'URL #7',
              url: '#',
            }
          ]
        },
      ]
    </script>
  `,
};

export default meta;
export const Default: StoryObj = {};
