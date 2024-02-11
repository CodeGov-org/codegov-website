import { DialogConfig, DialogRef } from '@angular/cdk/dialog';

import { LoadingDialogComponent } from './loading-dialog.component';

export interface LoadingDialogInput {
  message: string;
}

export function getLoadingDialogConfig(
  textInfo: LoadingDialogInput,
): DialogConfig<LoadingDialogInput, DialogRef<void, LoadingDialogComponent>> {
  const config = new DialogConfig<
    LoadingDialogInput,
    DialogRef<void, LoadingDialogComponent>
  >();
  config.data = textInfo;
  config.disableClose = true;
  config.closeOnDestroy = true;
  config.backdropClass = 'backdrop';

  return config;
}
