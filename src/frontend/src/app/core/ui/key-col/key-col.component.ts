import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-key-col',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      :host {
        grid-column: span 3;
        color: common.$black;

        @include common.md {
          grid-column: span 1;
        }

        @include common.dark {
          color: common.$white;
        }
      }
    `,
  ],
  template: `<ng-content />`,
})
export class KeyColComponent {}
