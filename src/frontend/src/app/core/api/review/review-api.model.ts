import { GetProposalReviewCommitResponse } from '../commit-review';

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
  images: ProposalReviewImage[];
  commits: GetProposalReviewCommitResponse[];
}

export interface ProposalReviewImage {
  path: string;
}

export interface GetMyProposalReviewSummaryRequest {
  proposalId: string;
}

export interface GetMyProposalReviewSummaryResponse {
  summaryMarkdown: string;
}

export interface CreateProposalReviewImageRequest {
  proposalId: string;
  contentType: string;
  contentBytes: Uint8Array;
}

export interface CreateProposalReviewImageResponse {
  path: string;
}

export interface DeleteProposalReviewImageRequest {
  proposalId: string;
  imagePath: string;
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
