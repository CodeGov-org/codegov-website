import { TestBed } from '@angular/core/testing';

import { ProposalApiService } from '~core/api';
import {
  ProposalApiServiceMock,
  proposalApiServiceMockFactory,
} from '~core/api/proposal/proposal-api.service.mock';
import { ProposalService } from './proposal.service';

describe('ProposalService', () => {
  let service: ProposalService;
  let proposalApiServiceMock: ProposalApiServiceMock;

  beforeEach(() => {
    proposalApiServiceMock = proposalApiServiceMockFactory();

    TestBed.configureTestingModule({
      providers: [
        { provide: ProposalApiService, useValue: proposalApiServiceMock },
      ],
    });

    service = TestBed.inject(ProposalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
