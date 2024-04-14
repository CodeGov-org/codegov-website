import { Overlay } from '@angular/cdk/overlay';

export type OverlayMock = jasmine.SpyObj<Overlay>;

export function overlayMockFactory(): OverlayMock {
  return jasmine.createSpyObj<OverlayMock>('Overlay', [
    'create',
    'position',
    'scrollStrategies',
  ]);
}
