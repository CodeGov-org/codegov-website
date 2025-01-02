import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      :host {
        background-color: common.$primary-900;
        border-color: 0.5px solid common.$primary-600;
        width: auto;
        border-radius: common.$border-radius;
        @include common.px(2);
        @include common.py(1);

        @include common.text-xs;
        color: common.$white;

        @include common.dark {
          background-color: common.$slate-900;
          border-color: common.$slate-500;
        }
      }
    `,
  ],
  template: `{{ tooltipText() }}`,
})
export class TooltipComponent {
  public readonly tooltipText = input.required<string>();
}
