import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-menu-close-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="m-1 h-7 w-7"
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
