import { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Atoms/Icons',
  args: {
    class: 'icon-md',
  },
  argTypes: {
    class: {
      control: {
        type: 'select',
        labels: {
          'icon-xs': 'XS',
          'icon-sm': 'SM',
          'icon-md': 'MD',
          'icon-lg': 'LG',
          'icon-xl': 'XL',
          'icon-xxl': 'XXL',
        },
      },
      options: [
        'icon-xs',
        'icon-sm',
        'icon-md',
        'icon-lg',
        'icon-xl',
        'icon-xxl',
      ],
    },
  },
  render: args => `
    <style>
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        grid-gap: 10px;
      }

      .grid-entry {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .grid-entry code {
        margin-top: 12px;
      }
    </style>

    <div class="grid">
      <div class="grid-entry">
        <cg-chevron-icon class="${args.class}"></cg-chevron-icon>
        <code>cg-chevron-icon</code>
      </div>

      <div class="grid-entry">
        <cg-clipboard-check-icon class="${args.class}"></cg-clipboard-check-icon>
        <code>cg-clipboard-check-icon</code>
      </div>

      <div class="grid-entry">
        <cg-clipboard-icon class="${args.class}"></cg-clipboard-icon>
        <code>cg-clipboard-icon</code>
      </div>

      <div class="grid-entry">
        <cg-close-icon class="${args.class}"></cg-close-icon>
        <code>cg-close-icon</code>
      </div>

      <div class="grid-entry">
        <cg-hamburger-icon class="${args.class}"></cg-hamburger-icon>
        <code>cg-hamburger-icon</code>
      </div>

      <div class="grid-entry">
        <cg-logo-icon class="${args.class}"></cg-logo-icon>
        <code>cg-logo-icon</code>
      </div>

      <div class="grid-entry">
        <cg-profile-icon class="${args.class}"></cg-profile-icon>
        <code>cg-profile-icon</code>
      </div>

      <div class="grid-entry">
        <cg-dash-circle-icon class="${args.class}"></cg-dash-circle-icon>
        <code>cg-dash-circle-icon</code>
      </div>

      <div class="grid-entry">
        <cg-check-circle-icon class="${args.class}"></cg-check-circle-icon>
        <code>cg-check-circle-icon</code>
      </div>

      <div class="grid-entry">
        <cg-loading-icon class="${args.class}"></cg-loading-icon>
        <code>cg-loading-icon</code>
      </div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};
