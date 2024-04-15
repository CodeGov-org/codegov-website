import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reject-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .reject-icon {
        width: size(6);
        height: size(6);
        stroke: $error;
      }
    `,
  ],
  template: `
    <svg
      class="reject-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"
      />
      <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8" />
    </svg>
  `,
})
export class RejectIconComponent {}
