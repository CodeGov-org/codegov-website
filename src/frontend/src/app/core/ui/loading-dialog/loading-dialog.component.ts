import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { LoadingIconComponent } from '@cg/angular-ui';

@Component({
  selector: 'app-loading-content',
  imports: [LoadingIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    :host {
      @include common.layer-50;

      display: flex;
      flex-direction: row;
      align-items: center;

      @include common.px(4);
      @include common.py(4);
      width: auto;
      border-radius: common.$border-md-radius;

      color: common.$white;
      background-color: common.$primary-800;

      @include common.dark {
        background-color: common.$slate-700;
        color: common.$slate-200;
      }
    }

    .dialog__icon {
      width: common.size(11);
      height: common.size(11);
    }

    .dialog__text {
      @include common.mx(4);
      margin-bottom: 0;
    }
  `,
  template: `
    <cg-loading-icon class="dialog__icon" />

    <h3 class="dialog__text">{{ infoText() }}</h3>
  `,
})
export class LoadingDialogComponent {
  public readonly infoText = signal(this.dialogRef.config.data.message);

  constructor(private readonly dialogRef: DialogRef<string>) {}
}
