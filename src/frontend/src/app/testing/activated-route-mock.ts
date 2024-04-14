import { ActivatedRoute } from '@angular/router';

export type ActivatedRouteMock = jasmine.SpyObj<ActivatedRoute>;

export function activatedRouteMockFactory(): ActivatedRouteMock {
  return jasmine.createSpyObj<ActivatedRouteMock>('ActivatedRoute', [
    'toString',
  ]);
}
