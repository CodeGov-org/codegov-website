export interface CreateProposalReviewCommitRequest {
  proposalReviewId: string;
  commitSha: string;
  reviewed: boolean;
}

export interface UpdateProposalReviewCommitRequest {
  proposalReviewCommitId: string;
  details: ReviewCommitDetails;
}

export interface DeleteProposalReviewCommitRequest {
  proposalReviewCommitId: string;
}

export interface GetProposalReviewCommitResponse {
  id: string;
  proposalReviewId: string;
  userId: string;
  createdAt: Date;
  lastUpdatedAt: Date | null;
  commitSha: string | null;
  details: ReviewCommitDetails;
}

export type ReviewCommitDetails =
  | ReviewedCommitDetails
  | NotReviewedCommitDetails;

export interface ReviewedCommitDetails {
  reviewed: true;
  comment: string | null;
  matchesDescription: boolean | null;
}

export interface NotReviewedCommitDetails {
  reviewed: false | null;
}
