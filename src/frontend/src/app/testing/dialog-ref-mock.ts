import { DialogRef } from '@angular/cdk/dialog';

export type DialogRefMock = jasmine.SpyObj<DialogRef>;

export function dialogRefMockFactory(): DialogRefMock {
  return jasmine.createSpyObj<DialogRefMock>('DialogRef', ['close', 'config']);
}
