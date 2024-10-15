import { ProposalApiService } from './proposal-api.service';

export type ProposalApiServiceMock = jasmine.SpyObj<ProposalApiService>;

export function proposalApiServiceMockFactory(): ProposalApiServiceMock {
  return jasmine.createSpyObj<ProposalApiServiceMock>('ProposalApiService', [
    'listAllProposals',
    'listClosedProposals',
    'listOpenProposals',
  ]);
}
