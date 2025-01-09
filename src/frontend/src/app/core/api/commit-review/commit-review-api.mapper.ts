import {
  fromCandidDate,
  fromCandidOpt,
  fromCandidOptDate,
  toCandidOpt,
} from '../../utils';
import {
  ProposalReviewCommitWithId,
  ReviewCommitState,
  CreateProposalReviewCommitRequest as CreateProposalReviewCommitApiRequest,
  UpdateProposalReviewCommitRequest as UpdateProposalReviewCommitApiRequest,
  DeleteProposalReviewCommitRequest as DeleteProposalReviewCommitApiRequest,
} from '@cg/backend';
import {
  CreateProposalReviewCommitRequest,
  DeleteProposalReviewCommitRequest,
  GetProposalReviewCommitResponse,
  ReviewCommitDetails,
  UpdateProposalReviewCommitRequest,
} from './commit-review-api.model';

export function mapCreateProposalReviewCommitRequest(
  req: CreateProposalReviewCommitRequest,
): CreateProposalReviewCommitApiRequest {
  return {
    commit_sha: req.commitSha,
    proposal_review_id: req.proposalReviewId,
    state: req.reviewed
      ? {
          reviewed: {
            comment: [],
            matches_description: [],
          },
        }
      : { not_reviewed: null },
  };
}

export function mapUpdateProposalReviewCommitRequest(
  req: UpdateProposalReviewCommitRequest,
): UpdateProposalReviewCommitApiRequest {
  return {
    id: req.proposalReviewCommitId,
    state: mapReviewCommitRequestDetails(req.details),
  };
}

export function mapDeleteProposalReviewCommitRequest(
  req: DeleteProposalReviewCommitRequest,
): DeleteProposalReviewCommitApiRequest {
  return {
    id: req.proposalReviewCommitId,
  };
}

export function mapGetProposalReviewCommitResponse(
  res: ProposalReviewCommitWithId,
): GetProposalReviewCommitResponse {
  return {
    id: res.id,
    proposalReviewId: res.proposal_review_commit.proposal_review_id,
    userId: res.proposal_review_commit.user_id,
    createdAt: fromCandidDate(res.proposal_review_commit.created_at),
    lastUpdatedAt: fromCandidOptDate(
      res.proposal_review_commit.last_updated_at,
    ),
    commitSha: res.proposal_review_commit.commit_sha,
    details: mapReviewCommitResponseDetails(res.proposal_review_commit.state),
  };
}

function mapReviewCommitRequestDetails(
  req: ReviewCommitDetails,
): ReviewCommitState {
  if (req.reviewed) {
    return {
      reviewed: {
        comment: toCandidOpt(req.comment),
        matches_description: toCandidOpt(req.matchesDescription),
      },
    };
  }

  return { not_reviewed: null };
}

function mapReviewCommitResponseDetails(
  state: ReviewCommitState,
): ReviewCommitDetails {
  if ('reviewed' in state) {
    return {
      reviewed: true,
      comment: fromCandidOpt(state.reviewed.comment),
      matchesDescription: fromCandidOpt(state.reviewed.matches_description),
    };
  }

  return {
    reviewed: false,
  };
}
