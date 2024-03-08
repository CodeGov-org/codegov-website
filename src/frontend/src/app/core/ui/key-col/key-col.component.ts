import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-key-col',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        grid-column: span 3;
        @include md {
          grid-column: span 1;
        }

        color: $black;
        @include dark {
          color: $white;
        }
      }
    `,
  ],
  template: `
    <ng-content />
  `,
})
export class KeyColComponent {}
