import { NnsProposalTopic, ProposalResponse } from '@cg/backend';
import {
  Proposal,
  ProposalLinkBaseUrl,
  ProposalVotingLinkType,
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
      reviewPeriodEnd: addDays(
        new Date(proposalResponse.proposal.proposed_at),
        2,
      ),
      votingPeriodEnd: addDays(
        new Date(proposalResponse.proposal.proposed_at),
        4,
      ),
      proposedAt: new Date(proposalResponse.proposal.proposed_at),
      proposedBy: proposalResponse.proposal.proposed_by,
      summary:
        "Elect new replica binary revision [85bd56a70e55b2cea75cae6405ae11243e5fdad8](https://github.com/dfinity/ic/tree/release-2024-02-21_23-01-p2p)\n\n# Release Notes:\n\nChange log since git revision [2e921c9adfc71f3edc96a9eb5d85fc742e7d8a9f](https://dashboard.internetcomputer.org/release/2e921c9adfc71f3edc96a9eb5d85fc742e7d8a9f)\n## Features:\n* [[85bd56a70](https://github.com/dfinity/ic/commit/85bd56a70)]  enable new p2p for consensus\n\nForum post: https://forum.dfinity.org/t/new-release-rc-2024-02-21-23-01/27834\n\n\n# IC-OS Verification\n\nTo build and verify the IC-OS disk image, run:\n\n```\n# From https://github.com/dfinity/ic#verifying-releases\nsudo apt-get install -y curl && curl --proto '=https' --tlsv1.2 -sSLO https://raw.githubusercontent.com/dfinity/ic/85bd56a70e55b2cea75cae6405ae11243e5fdad8/gitlab-ci/tools/repro-check.sh && chmod +x repro-check.sh && ./repro-check.sh -c 85bd56a70e55b2cea75cae6405ae11243e5fdad8\n```\n\nThe two SHA256 sums printed above from a) the downloaded CDN image and b) the locally built image,\nmust be identical, and must match the SHA256 from the payload of the NNS proposal.",

      proposalLinks: [
        {
          type: ProposalVotingLinkType.NNSDApp,
          link:
            ProposalLinkBaseUrl.NNSDApp +
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

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}