import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hamburger-menu-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .hamburger-menu-icon {
        width: size(7);
        height: size(7);
        margin: size(1);
      }
    `,
  ],
  template: `
    <svg
      class="hamburger-menu-icon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      ></path>
    </svg>
  `,
})
export class HamburgerMenuIconComponent {}
