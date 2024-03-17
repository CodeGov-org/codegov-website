import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'UI/Footer',

  render: () => `
    <cg-footer id="footer">
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
