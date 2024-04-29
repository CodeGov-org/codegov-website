import { ImageSet } from '@cg/angular-ui';

export interface ProposalReview {
  id: string;
  proposalId: string;
  reviewerId: string;
  reviewerVote: ReviewerVote;
  state: ReviewState;
  lastSaved: Date | undefined;
  timeSpent: number;
  summary: string;
  buildReproduced: boolean;
  buildImages: ImageSet[];
  reviewCommits: ProposalReviewCommit[];
}

export type ReviewState = 'Draft' | 'Completed';

export type ReviewerVote = 'ADOPT' | 'REJECT' | 'NO VOTE';

export interface ProposalReviewCommit {
  id: string;
  reviewId: string;
  commitSha: string;
  reviewed: boolean;
  matchesDescription: boolean | undefined;
  summary: string | undefined;
  highlights: string | undefined;
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
