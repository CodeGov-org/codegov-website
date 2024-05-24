import { GetProposalReviewCommitResponse } from '../commit-review';
import { ImageSet } from '@cg/angular-ui';

export interface CreateProposalReviewRequest {
  proposalId: string;
  summary: string | null;
  reviewDurationMins: number | null;
  buildReproduced: boolean | null;
  reproducedBuildImageId: string | null;
}

export interface UpdateProposalReviewRequest {
  proposalId: string;
  reviewDurationMins: number | null;
  summary: string | null;
  buildReproduced: boolean | null;
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
  vote: ProposalReviewVote;
  createdAt: Date;
  lastUpdatedAt: Date | null;
  status: ProposalReviewStatus;
  summary: string | null;
  reviewDurationMins: number | null;
  buildReproduced: boolean | null;
  reproducedBuildImageId: ImageSet[];
  commits: GetProposalReviewCommitResponse[];
}

export enum ProposalReviewStatus {
  Draft,
  Published,
}

export enum ProposalReviewVote {
  Adopt,
  Reject,
  NoVote,
}

export interface ProposalCommitReviewHighlight {
  reviewerId: string;
  text: string;
}

export interface ProposalCommitReviewSummary {
  proposalId: string;
  commitId: string;
  commitSha: string;
  highlights: ProposalCommitReviewHighlight[];
  totalReviewers: number;
  reviewedCount: number;
  matchesDescriptionCount: number;
}
