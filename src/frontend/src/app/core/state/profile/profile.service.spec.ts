import { backendActorServiceMockFactory } from '~core/services/backend-actor-service-mock';
import { routerMockFactory } from '~testing';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  const backendActorServiceMock = backendActorServiceMockFactory();
  const routerMock = routerMockFactory();

  beforeEach(() => {
    service = new ProfileService(backendActorServiceMock, routerMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
