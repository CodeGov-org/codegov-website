import { IcAuthService } from '@hadronous/ic-angular';

export type IcAuthServiceMock = jasmine.SpyObj<IcAuthService>;

export function icAuthServiceMockFactory(): IcAuthServiceMock {
  return jasmine.createSpyObj<IcAuthService>('IcAuthService', [
    'login',
    'logout',
  ]);
}
