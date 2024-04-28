export interface Proposal {
  id: string;
  ns_proposal_id: bigint;
  title: string;
  topic: ProposalTopic;
  type: string;
  state: ProposalState;
  reviewPeriodEnd: Date;
  votingPeriodEnd: Date;
  proposedAt: Date;
  proposedBy: bigint;
  reviewCompletedAt?: Date;
  decidedAt?: Date;
  summary: string;
  proposalLinks: ProposalVotingLink[];
  codeGovVote?: ProposalCodeGovVote;
}

export enum ProposalState {
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export enum ProposalTopic {
  SCM = 'System Canister Management',
  RVM = 'Replica Version Management',
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
