import { ProposalService } from './proposal.service';

export type ProposalServiceMock = jasmine.SpyObj<ProposalService>;

export function proposalServiceMockFactory(): ProposalServiceMock {
  return jasmine.createSpyObj<ProposalService>('ProposalService', [
    'loadOpenProposalList',
    'setCurrentProposalId',
  ]);
}
