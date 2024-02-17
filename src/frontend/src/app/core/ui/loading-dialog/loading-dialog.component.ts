import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component } from '@angular/core';

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

    <h3 class="dialog__text">{{ infoText }}</h3>
  `,
})
export class LoadingDialogComponent {
  public infoText: string;

  constructor(private readonly dialogRef: DialogRef<string>) {
    this.infoText = this.dialogRef.config.data.message;
  }
}
