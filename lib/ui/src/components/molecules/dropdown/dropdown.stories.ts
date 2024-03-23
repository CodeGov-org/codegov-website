import { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Molecules/Dropdown',
};

export default meta;

export const WithTextBtn: StoryObj = {
  name: 'With Text Button',
  render: () => `
    <cg-dropdown>
      <cg-dropdown-trigger slot="dropdownTrigger">
        Click me?
      </cg-dropdown-trigger>

      <cg-dropdown-menu slot="dropdownMenu">
        <cg-dropdown-link-menu-item href="#">
          Profile
        </cg-dropdown-link-menu-item>

        <cg-dropdown-link-menu-item href="#">
          Settings
        </cg-dropdown-link-menu-item>

        <cg-dropdown-link-menu-item href="#">
          Logout
        </cg-dropdown-link-menu-item>
      </cg-dropdown-menu>
    </cg-dropdown>
  `,
};

export const WithIconBtn: StoryObj = {
  name: 'With Icon Button',
  render: () => `
    <cg-dropdown>
      <div slot="dropdownTrigger">
        <cg-dropdown-trigger is-icon-btn="true" btn-label="Profile">
          <cg-profile-icon />
        </cg-dropdown-trigger>
      </div>

      <cg-dropdown-menu slot="dropdownMenu">
        <cg-dropdown-link-menu-item href="#">
          Profile
        </cg-dropdown-link-menu-item>

        <cg-dropdown-link-menu-item href="#">
          Settings
        </cg-dropdown-link-menu-item>

        <cg-dropdown-link-menu-item href="#">
          Logout
        </cg-dropdown-link-menu-item>
      </cg-dropdown-menu>
    </cg-dropdown>
  `,
};
