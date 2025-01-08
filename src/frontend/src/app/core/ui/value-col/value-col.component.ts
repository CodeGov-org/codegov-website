import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-value-col',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    :host {
      grid-column: span 3;
      align-content: center;
      margin-bottom: common.size(6);

      @include common.md {
        grid-column: span 2;
        margin-bottom: 0;
      }
    }
  `,
  template: `<ng-content />`,
})
export class ValueColComponent {}
