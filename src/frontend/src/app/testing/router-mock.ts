import { Router } from '@angular/router';

export type RouterMock = jasmine.SpyObj<Router>;

export function routerMockFactory(): RouterMock {
  return jasmine.createSpyObj<Router>('Router', [
    'navigate',
    'navigateByUrl',
    'url',
  ]);
}
