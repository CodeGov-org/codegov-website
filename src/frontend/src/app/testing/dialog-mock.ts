import { Dialog } from '@angular/cdk/dialog';

export type DialogMock = jasmine.SpyObj<Dialog>;

export function dialogMockFactory(): DialogMock {
  return jasmine.createSpyObj<DialogMock>('Dialog', ['open']);
}
