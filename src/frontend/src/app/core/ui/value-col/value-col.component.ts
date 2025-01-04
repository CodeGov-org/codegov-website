import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-value-col',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      :host {
        display: flex;
        flex-direction: row;
        align-items: center;

        grid-column: span 3;
        margin-bottom: common.size(6);
        @include common.md {
          grid-column: span 2;
          margin-bottom: 0;
        }
      }
    `,
  ],
  template: `<ng-content />`,
})
export class ValueColComponent {}
