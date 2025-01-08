import {
  fromCandidDate,
  fromCandidOpt,
  fromCandidOptDate,
  Ok,
  toCandidOpt,
} from '../../utils';
import { mapGetProposalReviewCommitResponse } from '../commit-review/commit-review-api.mapper';
import {
  CreateProposalReviewRequest as CreateProposalReviewApiRequest,
  UpdateProposalReviewRequest as UpdateProposalReviewApiRequest,
  ListProposalReviewsRequest as ListProposalReviewsApiRequest,
  GetProposalReviewRequest as GetProposalReviewApiRequest,
  GetMyProposalReviewRequest as GetMyProposalReviewApiRequest,
  ProposalReviewStatus as ProposalReviewStatusApi,
  ProposalVote as ApiProposalVote,
  GetMyProposalReviewSummaryRequest as GetMyProposalReviewSummaryApiRequest,
  GetMyProposalReviewSummaryResponse as GetMyProposalReviewSummaryApiResponse,
  GetProposalReviewResponse as GetProposalReviewApiResponse,
  CreateProposalReviewImageRequest as CreateProposalReviewImageApiRequest,
  CreateProposalReviewImageResponse as CreateProposalReviewImageApiResponse,
  DeleteProposalReviewImageRequest as DeleteProposalReviewImageApiRequest,
} from '@cg/backend';
import { ENV } from '~env';
import {
  GetProposalReviewResponse,
  UpdateProposalReviewRequest,
  GetMyProposalReviewRequest,
  CreateProposalReviewRequest,
  ListProposalReviewsRequest,
  GetProposalReviewRequest,
  ProposalReviewStatus,
  GetMyProposalReviewSummaryResponse,
  CreateProposalReviewImageRequest,
  CreateProposalReviewImageResponse,
  DeleteProposalReviewImageRequest,
} from './review-api.model';

export function mapCreateProposalReviewRequest(
  req: CreateProposalReviewRequest,
): CreateProposalReviewApiRequest {
  return {
    proposal_id: req.proposalId,
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
  res: Ok<GetProposalReviewApiResponse>,
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
    buildReproduced: fromCandidOpt(review.build_reproduced),
    images: review.images_paths.map(path => ({
      // [TODO]: use current domain when canisters are merged
      path: `${ENV.BACKEND_ORIGIN}${path}`,
    })),
    commits: review.proposal_review_commits.map(
      mapGetProposalReviewCommitResponse,
    ),
  };
}

export function mapGetMyProposalReviewSummaryRequest(
  req: GetMyProposalReviewRequest,
): GetMyProposalReviewSummaryApiRequest {
  return {
    proposal_id: req.proposalId,
  };
}

export function mapGetMyProposalReviewSummaryResponse(
  res: Ok<GetMyProposalReviewSummaryApiResponse>,
): GetMyProposalReviewSummaryResponse {
  return {
    summaryMarkdown: res.summary_markdown,
  };
}

export function mapCreateProposalReviewImageRequest(
  req: CreateProposalReviewImageRequest,
): CreateProposalReviewImageApiRequest {
  return {
    proposal_id: req.proposalId,
    content_type: req.contentType,
    content_bytes: req.contentBytes,
  };
}

export function mapCreateProposalReviewImageResponse(
  res: Ok<CreateProposalReviewImageApiResponse>,
): CreateProposalReviewImageResponse {
  return {
    // [TODO]: use current domain when canisters are merged
    path: `${ENV.BACKEND_ORIGIN}${res.path}`,
  };
}

export function mapDeleteProposalReviewImageRequest(
  req: DeleteProposalReviewImageRequest,
): DeleteProposalReviewImageApiRequest {
  return {
    proposal_id: req.proposalId,
    image_path: req.imagePath,
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
