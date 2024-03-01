import { backendActorServiceMockFactory } from '~core/services/backend-actor-service-mock';
import { ProposalService } from './proposal.service';

describe('ProposalService', () => {
  let service: ProposalService;
  const backendActorServiceMock = backendActorServiceMockFactory();

  beforeEach(() => {
    service = new ProposalService(backendActorServiceMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
