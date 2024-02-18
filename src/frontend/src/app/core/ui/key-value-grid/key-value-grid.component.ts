import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-key-value-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        display: grid;
        padding-bottom: size(4);

        gap: size(1) size(8);
        @include md {
          gap: size(6) size(8);
        }
      }

      :host-context(.key-value-grid--1-col) {
        grid-template-columns: repeat(3, 1fr);
      }

      :host-context(.key-value-grid--2-col) {
        grid-template-columns: repeat(6, 1fr);
      }
    `,
  ],
  template: `<ng-content />`,
})
export class KeyValueGridComponent {
  @Input()
  public columnNumber = 1;

  @HostBinding('class.key-value-grid--1-col')
  public get isOneColumn(): boolean {
    return this.columnNumber === 1;
  }

  @HostBinding('class.key-value-grid--2-col')
  public get isTwoColumns(): boolean {
    return this.columnNumber === 2;
  }
}
