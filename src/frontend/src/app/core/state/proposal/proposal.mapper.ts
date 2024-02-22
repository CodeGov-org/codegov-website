import { NnsProposalTopic, ProposalResponse } from '@cg/backend';
import {
  Proposal,
  ProposalLinkBaseUrl,
  ProposalLinkType,
  ProposalState,
  ProposalTopic,
} from './proposal.model';

export function mapOpenProposalListResponse(
  apiResponseList: ProposalResponse[],
): Proposal[] {
  const proposalsList = [];

  for (const proposalResponse of apiResponseList) {
    const proposalObject: Proposal = {
      id: proposalResponse.proposal.nervous_system.network.id,
      title: proposalResponse.proposal.title,
      topic: getProposalTopic(
        proposalResponse.proposal.nervous_system.network.topic,
      ),
      type: 'unknown',
      state: ProposalState.InProgress,
      reviewPeriodEnd: new Date(2024, 1, 17, 1, 1, 25),
      votingPeriodEnd: new Date(2024, 1, 19, 1, 1, 25),
      proposedAt: new Date(proposalResponse.proposal.proposed_at),
      proposedBy: proposalResponse.proposal.proposed_by,
      summary: 'This is a summary',
      proposalLinks: [
        {
          type: ProposalLinkType.NNSDApp,
          link:
            ProposalLinkBaseUrl.NNSDApp +
            proposalResponse.proposal.nervous_system.network.id,
        },
        {
          type: ProposalLinkType.DfinityDashboard,
          link:
            ProposalLinkBaseUrl.DfinityDashboard +
            proposalResponse.proposal.nervous_system.network.id,
        },
      ],
    };

    proposalsList.push(proposalObject);
  }
  return proposalsList;
}

function getProposalTopic(nnsProposalTopic: NnsProposalTopic): ProposalTopic {
  if ('replica_version_management' in nnsProposalTopic) {
    return ProposalTopic.RVM;
  } else return ProposalTopic.SCM;
}
