import { IcAuthService } from '@hadronous/ic-angular';

export type IcAuthServiceMock = jasmine.SpyObj<IcAuthService>;

export function icAuthServiceMockFactory(): IcAuthServiceMock {
  return jasmine.createSpyObj<IcAuthServiceMock>('IcAuthService', [
    'login',
    'logout',
  ]);
}
