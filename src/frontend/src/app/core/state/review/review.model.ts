import { ImageSet } from '@cg/angular-ui';

export interface Review {
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
  reviewCommits: ReviewCommit[];
}

export type ReviewState = 'Draft' | 'Completed';

export type ReviewerVote = 'ADOPT' | 'REJECT' | 'NO VOTE';

export interface ReviewCommit {
  id: bigint;
  reviewId: bigint;
  commitId: string;
  reviewed: 0 | 1;
  matchesDescription: 0 | 1;
  summary: string;
  highlights: string;
}

export interface ReviewHighlight {
  reviewerId: bigint;
  text: string;
}

export interface ProposalCommit {
  proposalId: bigint;
  commitId: string;
  highlights: ReviewHighlight[];
  totalReviewers: number;
  reviewedCount: number;
  matchesDescriptionCount: number;
}
