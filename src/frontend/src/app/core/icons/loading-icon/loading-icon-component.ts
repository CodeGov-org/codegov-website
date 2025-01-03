import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      .loading-icon {
        width: 100%;
        height: 100%;
        margin: auto;
        display: block;
        background: none;
      }

      .loading-icon__svg {
        fill: none;
        stroke-width: 10px;
      }

      .loading-icon__svg--primary {
        stroke: common.$primary;
      }

      .loading-icon__svg--white {
        stroke: common.$white;
      }
    `,
  ],
  template: `
    <svg
      class="loading-icon"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      style="shape-rendering: auto;"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
    >
      <circle
        [class]="'loading-icon__svg loading-icon__svg--' + theme()"
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
export class LoadingIconComponent {
  public readonly theme = input<'white' | 'primary'>('primary');
}
