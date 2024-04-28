import { backendActorServiceMockFactory } from '~core/services/backend-actor-service-mock';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;
  const backendActorServiceMock = backendActorServiceMockFactory();

  beforeEach(() => {
    service = new ReviewService(backendActorServiceMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
