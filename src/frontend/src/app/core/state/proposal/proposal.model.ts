export interface Proposal {
  id: bigint | number;
  title: string;
  topic: ProposalTopic;
  type: string;
  state: ProposalState;
  reviewPeriodEnd: Date;
  votingPeriodEnd: Date;
  proposedAt: Date;
  proposedBy: bigint | number;
  summary: string;
  proposalLinks: ProposalVotingLink[];
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
}

export enum ProposalLinkBaseUrl {
  NNSDApp = 'https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=',
  ProposalId = 'https://dashboard.internetcomputer.org/proposal/',
  Neuron = 'https://dashboard.internetcomputer.org/neuron/',
}
