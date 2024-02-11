import { OverlayPositionBuilder } from '@angular/cdk/overlay';

export type OverlayPositionBuilderMock = jasmine.SpyObj<OverlayPositionBuilder>;

export function overlayPositionBuilderFactory(): OverlayPositionBuilderMock {
  return jasmine.createSpyObj<OverlayPositionBuilder>(
    'OverlayPositionBuilder',
    ['flexibleConnectedTo', 'global'],
  );
}
