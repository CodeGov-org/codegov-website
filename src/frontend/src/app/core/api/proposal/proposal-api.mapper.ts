import {
  ListProposalsRequest as ListProposalsApiRequest,
  ProposalResponse,
  ReviewPeriodState,
} from '@cg/backend';
import { addDays } from '@cg/utils';
import {
  fromCandidDate,
  fromCandidOpt,
  fromCandidOptDate,
  toCandidOpt,
} from '~core/utils';
import {
  GetProposalResponse,
  ListProposalsRequest,
  BaseUrl,
  ProposalState,
  ProposalTopic,
  ProposalVotingLinkType,
} from './proposal-api.model';

export function mapListProposalsRequest(
  req: ListProposalsRequest,
): ListProposalsApiRequest {
  switch (req.state) {
    default:
    case ProposalState.Any:
      return { state: toCandidOpt() };
    case ProposalState.InProgress:
      return { state: toCandidOpt({ in_progress: null }) };
    case ProposalState.Completed:
      return { state: toCandidOpt({ completed: null }) };
  }
}

export function mapGetProposalResponse(
  res: ProposalResponse,
): GetProposalResponse {
  const proposalInfo = res.proposal.nervous_system.network.proposal_info;
  const proposal = fromCandidOpt(proposalInfo.proposal);
  const proposer = fromCandidOpt(proposalInfo.proposer);

  return {
    id: res.id,
    nsProposalId: res.proposal.nervous_system.network.id,
    title: fromCandidOpt(proposal?.title),
    topic: getProposalTopic(proposalInfo.topic),
    type: 'unknown',
    state: getProposalState(res.proposal.state),
    reviewPeriodEnd: addDays(fromCandidDate(res.proposal.proposed_at), 2),
    votingPeriodEnd: addDays(fromCandidDate(res.proposal.proposed_at), 3),
    proposedAt: fromCandidDate(res.proposal.proposed_at),
    proposedBy: proposer?.id ?? null,
    reviewCompletedAt: fromCandidOptDate(
      'completed' in res.proposal.state
        ? [res.proposal.state.completed.completed_at]
        : [],
    ),
    decidedAt: addDays(fromCandidDate(res.proposal.proposed_at), 3),
    summary:
      "Elect new replica binary revision [85bd56a70e55b2cea75cae6405ae11243e5fdad8](https://github.com/dfinity/ic/tree/release-2024-02-21_23-01-p2p)\n\n# Release Notes:\n\nChange log since git revision [2e921c9adfc71f3edc96a9eb5d85fc742e7d8a9f](https://dashboard.internetcomputer.org/release/2e921c9adfc71f3edc96a9eb5d85fc742e7d8a9f)\n## Features:\n* [[85bd56a70](https://github.com/dfinity/ic/commit/85bd56a70)]  enable new p2p for consensus\n\nForum post: https://forum.dfinity.org/t/new-release-rc-2024-02-21-23-01/27834\n\n\n# IC-OS Verification\n\nTo build and verify the IC-OS disk image, run:\n\n```\n# From https://github.com/dfinity/ic#verifying-releases\nsudo apt-get install -y curl && curl --proto '=https' --tlsv1.2 -sSLO https://raw.githubusercontent.com/dfinity/ic/85bd56a70e55b2cea75cae6405ae11243e5fdad8/gitlab-ci/tools/repro-check.sh && chmod +x repro-check.sh && ./repro-check.sh -c 85bd56a70e55b2cea75cae6405ae11243e5fdad8\n```\n\nThe two SHA256 sums printed above from a) the downloaded CDN image and b) the locally built image,\nmust be identical, and must match the SHA256 from the payload of the NNS proposal.",
    proposalLinks: [
      {
        type: ProposalVotingLinkType.NNSDApp,
        link: BaseUrl.NNSDApp + res.proposal.nervous_system.network.id,
      },
      {
        type: ProposalVotingLinkType.ICLight,
        link: BaseUrl.ICLight + res.proposal.nervous_system.network.id,
      },
    ],
  };
}

function getProposalTopic(nnsProposalTopic: number): ProposalTopic {
  if (nnsProposalTopic === 13) {
    return ProposalTopic.IcOsVersionElection;
  }

  if (nnsProposalTopic === 8) {
    return ProposalTopic.NetworkCanisterManagement;
  }

  throw new Error('Unknown proposal topic');
}

function getProposalState(proposalState: ReviewPeriodState): ProposalState {
  if ('in_progress' in proposalState) {
    return ProposalState.InProgress;
  }

  if ('completed' in proposalState) {
    return ProposalState.Completed;
  }

  throw new Error('Unknown proposal state');
}
