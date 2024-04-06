import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Organisms/Navbar',
  render: () => `
  <cg-navbar id="navbar"></cg-navbar>

  <script>
    document
      .getElementById('navbar')
      .links = [
        {
          title: 'URL #1',
          url: '#',
        },
        {
          title: 'URL #2',
          url: '#',
        },
        {
          title: 'Section #1',
          children: [
            {
              title: 'URL #3',
              url: '#',
            },
            {
              title: 'URL #4',
              url: '#',
            }
          ]
        },
        {
          title: 'Section #2',
          children: [
            {
              title: 'URL #5',
              url: '#',
            },
            {
              title: 'URL #6',
              url: '#',
            }
          ]
        }
      ]
  </script>
  `,
};

export default meta;

export const Default: StoryObj = {};
