import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-info-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    .info-icon {
      width: common.size(5);
      height: common.size(5);
      margin-left: common.size(2);
      vertical-align: text-bottom;
    }
  `,
  template: `
    <svg
      class="info-icon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
      ></path>
    </svg>
  `,
})
export class InfoIconComponent {}
