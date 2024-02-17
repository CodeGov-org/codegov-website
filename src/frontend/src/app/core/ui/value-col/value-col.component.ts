import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-value-col',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        display: flex;
        flex-direction: row;
        align-items: center;

        grid-column: span 3;
        margin-bottom: size(8);
        @include md {
          grid-column: span 2;
          margin-bottom: 0;
        }
      }
    `,
  ],
  template: `<ng-content />`,
})
export class ValueColComponent {}
