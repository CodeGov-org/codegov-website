import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-menu-close-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .menu-close-icon {
        width: size(7);
        height: size(7);
        margin: size(1);
      }
    `,
  ],
  template: `
    <svg
      class="menu-close-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 18L18 6M6 6l12 12"
      ></path>
    </svg>
  `,
})
export class MenuCloseIconComponent {}
