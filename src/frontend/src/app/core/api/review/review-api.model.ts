import { GetProposalReviewCommitResponse } from '../commit-review';
import { ImageSet } from '@cg/angular-ui';

export interface CreateProposalReviewRequest {
  proposalId: string;
  summary?: string | null;
  buildReproduced?: boolean | null;
  vote?: boolean | null;
}

export interface UpdateProposalReviewRequest {
  proposalId: string;
  status?: ProposalReviewStatus | null;
  summary?: string | null;
  buildReproduced?: boolean | null;
  vote?: boolean | null;
}

export interface ListProposalReviewsRequest {
  proposalId?: string | null;
  userId?: string | null;
}

export interface GetProposalReviewRequest {
  proposalReviewId: string;
}

export interface GetMyProposalReviewRequest {
  proposalId: string;
}

export interface GetProposalReviewResponse {
  id: string;
  proposalId: string;
  userId: string;
  vote: boolean | null;
  createdAt: Date;
  lastUpdatedAt: Date | null;
  status: ProposalReviewStatus;
  summary: string | null;
  buildReproduced: boolean | null;
  reproducedBuildImageId: ImageSet[];
  commits: GetProposalReviewCommitResponse[];
}

export interface GetMyProposalReviewSummaryRequest {
  proposalId: string;
}

export interface GetMyProposalReviewSummaryResponse {
  summaryMarkdown: string;
}

export enum ProposalReviewStatus {
  Draft = 'Draft',
  Published = 'Published',
}

export enum ProposalReviewVote {
  Adopt = 'Adopt',
  Reject = 'Reject',
  NoVote = 'NoVote',
}
