import { routerMockFactory } from 'src/app/testing/router-mock';

import { icAuthServiceMockFactory } from '~testing';
import { backendActorServiceMockFactory } from './backend-actor-service-mock';
import { UserAuthService } from './user-auth.service';

describe('UserAuthService', () => {
  let service: UserAuthService;
  const icAuthServiceMock = icAuthServiceMockFactory();
  const backendActorServiceMock = backendActorServiceMockFactory();
  const routerMock = routerMockFactory();

  beforeEach(() => {
    service = new UserAuthService(
      icAuthServiceMock,
      backendActorServiceMock,
      routerMock,
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
