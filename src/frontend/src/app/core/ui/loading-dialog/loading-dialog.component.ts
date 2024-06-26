import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { LoadingIconComponent } from '~core/icons';

@Component({
  selector: 'app-loading-content',
  standalone: true,
  imports: [LoadingIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        @include layer-50;

        display: flex;
        flex-direction: row;
        align-items: center;

        @include px(4);
        @include py(4);
        width: auto;
        border-radius: $border-radius;

        color: $white;
        background-color: $primary-800;

        @include dark {
          background-color: $slate-700;
          color: $slate-200;
        }
      }

      .dialog__icon {
        width: size(11);
        height: size(11);
      }

      .dialog__text {
        @include mx(4);
        margin-bottom: 0;
      }
    `,
  ],
  template: `
    <app-loading-icon class="dialog__icon" />

    <h3 class="dialog__text">{{ infoText() }}</h3>
  `,
})
export class LoadingDialogComponent {
  public readonly infoText = signal(this.dialogRef.config.data.message);

  constructor(private readonly dialogRef: DialogRef<string>) {}
}
