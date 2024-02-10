import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-loading-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="m-auto block h-11 w-11 bg-none"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      style="shape-rendering: auto;"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
    >
      <circle
        class="stroke-primary fill-none stroke-[10px] "
        cx="50"
        cy="50"
        r="32"
        stroke-dasharray="50.26548245743669 50.26548245743669"
        stroke-linecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          repeatCount="indefinite"
          dur="1.5384615384615383s"
          keyTimes="0;1"
          values="0 50 50;360 50 50"
        ></animateTransform>
      </circle>
    </svg>
  `,
})
export class LoadingIconComponent {}
