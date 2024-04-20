import { ImageSet } from '@cg/angular-ui';

export interface ProposalReview {
  id: bigint;
  proposalId: bigint;
  reviewerId: bigint;
  reviewerVote: ReviewerVote;
  state: ReviewState;
  lastSaved: Date;
  timeSpent: number;
  summary: string;
  buildReproduced: boolean;
  buildImages: ImageSet[];
  reviewCommits: ProposalReviewCommit[];
}

export type ReviewState = 'Draft' | 'Completed';

export type ReviewerVote = 'ADOPT' | 'REJECT' | 'NO VOTE';

export interface ProposalReviewCommit {
  id: bigint;
  reviewId: bigint;
  commitId: string;
  reviewed: 0 | 1;
  matchesDescription: 0 | 1;
  summary: string;
  highlights: string;
}

export interface ProposalCommitReviewHighlight {
  reviewerId: bigint;
  text: string;
}

export interface ProposalCommitReviewSummary {
  proposalId: bigint;
  commitId: string;
  highlights: ProposalCommitReviewHighlight[];
  totalReviewers: number;
  reviewedCount: number;
  matchesDescriptionCount: number;
}
