import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LoadingIconComponent } from '~core/icons';

@Component({
  selector: 'app-loading-content',
  standalone: true,
  imports: [LoadingIconComponent],
  template: `
    <div
      class="flex w-auto flex-row items-center rounded-lg bg-cyan-800 px-4 py-4 text-white dark:bg-slate-700 dark:text-slate-200"
    >
      <app-loading-icon />
      <h3 class="mx-4 mb-0">{{ infoText }}</h3>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingDialogComponent {
  public infoText: string;

  constructor(private readonly dialogRef: DialogRef<string>) {
    this.infoText = this.dialogRef.config.data.message;
  }
}
