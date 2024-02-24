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
  proposalLinks: ProposalLink[];
}

export enum ProposalState {
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export enum ProposalTopic {
  SCM = 'System Canister Management',
  RVM = 'Replica Version Management',
}

export interface ProposalLink {
  type: ProposalLinkType;
  link: string;
}

export enum ProposalLinkType {
  NNSDApp = 'NNS DApp',
  DfinityDashboard = 'Dashboard',
}

export enum LinkBaseUrl {
  NNSDApp = 'https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=',
  DfinityDashboard = 'https://dashboard.internetcomputer.org/proposal/',
}

export const NEURON_LINK_BASE_URL =
  'https://dashboard.internetcomputer.org/neuron/';
