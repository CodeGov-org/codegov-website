import { Router } from '@angular/router';

export type RouterMock = jasmine.SpyObj<Router>;

export function routerMockFactory(): RouterMock {
  return jasmine.createSpyObj<RouterMock>('Router', [
    'navigate',
    'navigateByUrl',
    'url',
  ]);
}
