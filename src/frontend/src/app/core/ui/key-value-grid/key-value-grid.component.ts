import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  computed,
  input,
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
        grid-template-columns: repeat(3, 1fr);
        margin-bottom: size(8);

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
  template: `
    <ng-content />
  `,
})
export class KeyValueGridComponent {
  public readonly columnNumber = input(1);

  @HostBinding('class.key-value-grid--1-col')
  public get hasOneColumnClass(): boolean {
    return this.isOneColumn();
  }
  private readonly isOneColumn = computed(() => this.columnNumber() === 1);

  @HostBinding('class.key-value-grid--2-col')
  public get hasTwoColumnsClass(): boolean {
    return this.isTwoColumns();
  }
  private readonly isTwoColumns = computed(() => this.columnNumber() === 2);
}
