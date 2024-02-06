import { IcAgentService } from '@hadronous/ic-angular';

export type IcAgentServiceMock = jasmine.SpyObj<IcAgentService>;

export function icAgentServiceMockFactory(): IcAgentServiceMock {
  return jasmine.createSpyObj<IcAgentService>('IcAgentService', [
    'fetchRootKey',
    'getInnerAgent',
    'replaceIdentity',
  ]);
}
