import {
  fromCandidDate,
  fromCandidOpt,
  fromCandidOptDate,
  toCandidOpt,
} from '../../utils';
import { mapGetProposalReviewCommitResponse } from '../commit-review/commit-review-api.mapper';
import { ImageSet } from '@cg/angular-ui';
import {
  ProposalReviewWithId,
  CreateProposalReviewRequest as CreateProposalReviewApiRequest,
  UpdateProposalReviewRequest as UpdateProposalReviewApiRequest,
  ListProposalReviewsRequest as ListProposalReviewsApiRequest,
  GetProposalReviewRequest as GetProposalReviewApiRequest,
  GetMyProposalReviewRequest as GetMyProposalReviewApiRequest,
  ProposalReviewStatus as ProposalReviewStatusApi,
  ProposalVote as ApiProposalVote,
} from '@cg/backend';
import {
  GetProposalReviewResponse,
  UpdateProposalReviewRequest,
  GetMyProposalReviewRequest,
  CreateProposalReviewRequest,
  ListProposalReviewsRequest,
  GetProposalReviewRequest,
  ProposalReviewStatus,
} from './review-api.model';

export function mapCreateProposalReviewRequest(
  req: CreateProposalReviewRequest,
): CreateProposalReviewApiRequest {
  return {
    proposal_id: req.proposalId,
    review_duration_mins: toCandidOpt(req.reviewDurationMins),
    summary: toCandidOpt(req.summary),
    build_reproduced: toCandidOpt(req.buildReproduced),
    vote: toCandidOpt(mapProposalVoteRequest(req.vote)),
  };
}

export function mapUpdateProposalReviewRequest(
  req: UpdateProposalReviewRequest,
): UpdateProposalReviewApiRequest {
  return {
    proposal_id: req.proposalId,
    status: toCandidOpt(mapProposalReviewStatusRequest(req.status)),
    review_duration_mins: toCandidOpt(req.reviewDurationMins),
    summary: toCandidOpt(req.summary),
    build_reproduced: toCandidOpt(req.buildReproduced),
    vote: toCandidOpt(mapProposalVoteRequest(req.vote)),
  };
}

export function mapListProposalReviewsRequest(
  req: ListProposalReviewsRequest,
): ListProposalReviewsApiRequest {
  return {
    proposal_id: toCandidOpt(req.proposalId),
    user_id: toCandidOpt(req.userId),
  };
}

export function mapGetProposalReviewRequest(
  req: GetProposalReviewRequest,
): GetProposalReviewApiRequest {
  return {
    proposal_review_id: req.proposalReviewId,
  };
}

export function mapGetMyProposalReviewRequest(
  req: GetMyProposalReviewRequest,
): GetMyProposalReviewApiRequest {
  return {
    proposal_id: req.proposalId,
  };
}

export function mapGetProposalReviewResponse(
  res: ProposalReviewWithId,
): GetProposalReviewResponse {
  const review = res.proposal_review;

  return {
    id: res.id,
    proposalId: review.proposal_id,
    userId: review.user_id,
    vote: mapProposalVoteResponse(review.vote),
    createdAt: fromCandidDate(review.created_at),
    lastUpdatedAt: fromCandidOptDate(review.last_updated_at),
    status: mapProposalReviewStatusResponse(review.status),
    summary: fromCandidOpt(review.summary),
    reviewDurationMins: fromCandidOpt(review.review_duration_mins),
    buildReproduced: fromCandidOpt(review.build_reproduced),
    // [TODO] - connect with API once it's implemented
    reproducedBuildImageId: getReviewImages(),
    commits: res.proposal_review.proposal_review_commits.map(
      mapGetProposalReviewCommitResponse,
    ),
  };
}

function mapProposalReviewStatusRequest(
  status?: ProposalReviewStatus | null,
): ProposalReviewStatusApi | null {
  switch (status) {
    case ProposalReviewStatus.Published: {
      return { published: null };
    }

    case ProposalReviewStatus.Draft: {
      return { draft: null };
    }

    default: {
      return null;
    }
  }
}

function mapProposalReviewStatusResponse(
  res: ProposalReviewStatusApi,
): ProposalReviewStatus {
  if ('published' in res) {
    return ProposalReviewStatus.Published;
  }

  return ProposalReviewStatus.Draft;
}

function mapProposalVoteRequest(vote?: boolean | null): ApiProposalVote | null {
  switch (vote) {
    case true: {
      return { yes: null };
    }
    case false: {
      return { no: null };
    }
    default: {
      return null;
    }
  }
}

function mapProposalVoteResponse(vote: ApiProposalVote): boolean | null {
  if ('yes' in vote) {
    return true;
  }

  if ('no' in vote) {
    return false;
  }

  return null;
}

function getReviewImages(): ImageSet[] {
  return [
    {
      sm: {
        url: '../assets/apple-touch-icon.png',
        size: 10,
        width: 10,
        height: 10,
      },
      md: {
        url: '../assets/apple-touch-icon.png',
        size: 100,
        width: 100,
        height: 100,
      },
      lg: {
        url: '../assets/apple-touch-icon.png',
        size: 100,
        width: 100,
        height: 100,
      },
      xl: {
        url: '../assets/apple-touch-icon.png',
        size: 100,
        width: 100,
        height: 100,
      },
      xxl: {
        url: '../assets/apple-touch-icon.png',
        size: 100,
        width: 100,
        height: 100,
      },
    },
    {
      sm: {
        url: '../assets/codegov-logo.png',
        size: 10,
        width: 10,
        height: 10,
      },
      md: {
        url: '../assets/codegov-logo.png',
        size: 100,
        width: 100,
        height: 100,
      },
      lg: {
        url: '../assets/codegov-logo.png',
        size: 100,
        width: 100,
        height: 100,
      },
      xl: {
        url: '../assets/codegov-logo.png',
        size: 100,
        width: 100,
        height: 100,
      },
      xxl: {
        url: '../assets/codegov-logo.png',
        size: 100,
        width: 100,
        height: 100,
      },
    },
  ];
}
