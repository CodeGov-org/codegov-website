export enum ProposalState {
  InProgress = 'InProgress',
  Completed = 'Completed',
  Any = 'Any',
}

export interface ListProposalsRequest {
  state: ProposalState;
}

export interface GetProposalResponse {
  id: string;
  nsProposalId: bigint;
  title: string | null;
  topic: ProposalTopic;
  type: string;
  state: ProposalState;
  reviewPeriodEnd: Date;
  votingPeriodEnd: Date;
  proposedAt: Date;
  proposedBy: bigint | null;
  reviewCompletedAt: Date | null;
  decidedAt: Date | null;
  summary: string;
  proposalLinks: ProposalVotingLink[];
  codeGovVote: ProposalCodeGovVote | null;
}

export enum ProposalTopic {
  SCM = 'SystemCanisterManagement',
  RVM = 'ReplicaVersionManagement',
}

export interface ProposalVotingLink {
  type: ProposalVotingLinkType;
  link: string;
}

export enum ProposalVotingLinkType {
  NNSDApp = 'NNS DApp',
  ICLight = 'ICLight',
}

export enum ProposalLinkBaseUrl {
  NNSDApp = 'https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=',
  Proposal = 'https://dashboard.internetcomputer.org/proposal/',
  Neuron = 'https://dashboard.internetcomputer.org/neuron/',
  ICLight = 'https://iclight.io/nns/proposals/',
}

export type ProposalCodeGovVote = 'ADOPT' | 'REJECT' | 'NO VOTE';