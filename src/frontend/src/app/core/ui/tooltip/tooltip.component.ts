import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        background-color: $primary-900;
        border-color: 0.5px solid $primary-600;
        width: auto;
        border-radius: $border-radius;
        @include px(2);
        @include py(1);

        @include text-xs;
        color: $white;

        @include dark {
          background-color: $slate-900;
          border-color: $slate-500;
        }
      }
    `,
  ],
  template: `{{ tooltipText }}`,
})
export class TooltipComponent {
  @Input({ required: true })
  public tooltipText!: string;
}
