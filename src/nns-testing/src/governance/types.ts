export interface CreateIcOsVersionElectionProposalRequest {
  neuronId: bigint;
  title: string;
  summary: string;
  replicaVersion: string;
}

export interface SyncMainnetProposalRequest {
  neuronId: bigint;
  proposalId: bigint;
}
