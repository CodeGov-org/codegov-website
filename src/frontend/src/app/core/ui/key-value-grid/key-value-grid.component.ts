import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-key-value-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        display: grid;
        grid-template-columns: repeat(3, 1fr);

        gap: size(1) size(8);
        @include md {
          gap: size(6) size(8);
        }
      }
    `,
  ],
  template: `<ng-content />`,
})
export class KeyValueGridComponent {}
