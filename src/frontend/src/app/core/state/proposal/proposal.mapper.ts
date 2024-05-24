import { fromCandidDate, fromCandidOptDate } from '../../utils';
import {
  NnsProposalTopic,
  ProposalResponse,
  ReviewPeriodState,
} from '@cg/backend';
import {
  Proposal,
  ProposalLinkBaseUrl,
  ProposalVotingLinkType,
  ProposalState,
  ProposalTopic,
} from './proposal.model';

export function mapProposalListResponse(
  apiResponseList: ProposalResponse[],
): Proposal[] {
  return apiResponseList.map(proposalResponse => ({
    id: proposalResponse.id,
    ns_proposal_id: proposalResponse.proposal.nervous_system.network.id,
    title: proposalResponse.proposal.title,
    topic: getProposalTopic(
      proposalResponse.proposal.nervous_system.network.topic,
    ),
    type: 'unknown',
    state: getProposalState(proposalResponse.proposal.state),
    reviewPeriodEnd: addDays(
      fromCandidDate(proposalResponse.proposal.proposed_at),
      2,
    ),
    votingPeriodEnd: addDays(
      fromCandidDate(proposalResponse.proposal.proposed_at),
      3,
    ),
    proposedAt: fromCandidDate(proposalResponse.proposal.proposed_at),
    proposedBy: proposalResponse.proposal.proposed_by,
    reviewCompletedAt: fromCandidOptDate(
      proposalResponse.proposal.review_completed_at,
    ),
    decidedAt: addDays(
      fromCandidDate(proposalResponse.proposal.proposed_at),
      3,
    ),
    summary:
      "Elect new replica binary revision [85bd56a70e55b2cea75cae6405ae11243e5fdad8](https://github.com/dfinity/ic/tree/release-2024-02-21_23-01-p2p)\n\n# Release Notes:\n\nChange log since git revision [2e921c9adfc71f3edc96a9eb5d85fc742e7d8a9f](https://dashboard.internetcomputer.org/release/2e921c9adfc71f3edc96a9eb5d85fc742e7d8a9f)\n## Features:\n* [[85bd56a70](https://github.com/dfinity/ic/commit/85bd56a70)]  enable new p2p for consensus\n\nForum post: https://forum.dfinity.org/t/new-release-rc-2024-02-21-23-01/27834\n\n\n# IC-OS Verification\n\nTo build and verify the IC-OS disk image, run:\n\n```\n# From https://github.com/dfinity/ic#verifying-releases\nsudo apt-get install -y curl && curl --proto '=https' --tlsv1.2 -sSLO https://raw.githubusercontent.com/dfinity/ic/85bd56a70e55b2cea75cae6405ae11243e5fdad8/gitlab-ci/tools/repro-check.sh && chmod +x repro-check.sh && ./repro-check.sh -c 85bd56a70e55b2cea75cae6405ae11243e5fdad8\n```\n\nThe two SHA256 sums printed above from a) the downloaded CDN image and b) the locally built image,\nmust be identical, and must match the SHA256 from the payload of the NNS proposal.",
    proposalLinks: [
      {
        type: ProposalVotingLinkType.NNSDApp,
        link:
          ProposalLinkBaseUrl.NNSDApp +
          proposalResponse.proposal.nervous_system.network.id,
      },
      {
        type: ProposalVotingLinkType.ICLight,
        link:
          ProposalLinkBaseUrl.ICLight +
          proposalResponse.proposal.nervous_system.network.id,
      },
    ],
    codeGovVote: 'ADOPT',
  }));
}

function getProposalTopic(nnsProposalTopic: NnsProposalTopic): ProposalTopic {
  if ('replica_version_management' in nnsProposalTopic) {
    return ProposalTopic.RVM;
  } else if ('system_canister_management' in nnsProposalTopic) {
    return ProposalTopic.SCM;
  } else throw new Error('Unknown proposal topic');
}

function getProposalState(proposalState: ReviewPeriodState): ProposalState {
  if ('in_progress' in proposalState) {
    return ProposalState.InProgress;
  } else if ('completed' in proposalState) {
    return ProposalState.Completed;
  } else throw new Error('Unknown proposal state');
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}
