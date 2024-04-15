import { ProposalService } from './proposal.service';

export type ProposalServiceMock = jasmine.SpyObj<ProposalService>;

export function proposalServiceMockFactory(): ProposalServiceMock {
  return jasmine.createSpyObj<ProposalServiceMock>('ProposalService', [
    'loadProposalList',
    'setCurrentProposalId',
  ]);
}
