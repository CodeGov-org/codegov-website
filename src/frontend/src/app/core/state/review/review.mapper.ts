import { ImageSet } from '@cg/angular-ui';
import {
  ProposalReviewStatus,
  ProposalReviewWithId,
  ReviewCommitState,
} from '@cg/backend';
import { ProposalReview, ReviewState } from './review.model';

export function mapReviewListResponse(
  apiResponseList: ProposalReviewWithId[],
): ProposalReview[] {
  return apiResponseList.map(reviewResponse =>
    mapReviewResponse(reviewResponse),
  );
}

export function mapReviewResponse(
  reviewResponse: ProposalReviewWithId,
): ProposalReview {
  return {
    id: reviewResponse.id,
    proposalId: reviewResponse.proposal_review.proposal_id,
    reviewerId: reviewResponse.proposal_review.user_id,
    reviewerVote: 'ADOPT',
    state: getReviewState(reviewResponse.proposal_review.status),
    lastSaved: getLastSavedDate(reviewResponse.proposal_review.last_updated_at),
    timeSpent: reviewResponse.proposal_review.review_duration_mins,
    summary: reviewResponse.proposal_review.summary,
    buildReproduced: reviewResponse.proposal_review.build_reproduced,
    buildImages: getReviewImages(), //TODO when images are implemented
    reviewCommits: reviewResponse.proposal_review.proposal_review_commits.map(
      commit => ({
        id: commit.id,
        commitSha: commit.proposal_review_commit.commit_sha,
        reviewId: commit.proposal_review_commit.proposal_review_id,
        reviewed: 'reviewed' in commit.proposal_review_commit.state,
        matchesDescription: getMatchesDescription(
          commit.proposal_review_commit.state,
        ),
        summary: getSummary(commit.proposal_review_commit.state),
        highlights: getHighlights(commit.proposal_review_commit.state),
      }),
    ),
  };
}

function getReviewState(status: ProposalReviewStatus): ReviewState {
  if ('published' in status) {
    return 'Completed';
  } else if ('draft' in status) {
    return 'Draft';
  } else throw new Error('Unknown proposal state');
}

function getLastSavedDate(lastUpdatedAt: [] | [string]): Date | undefined {
  return lastUpdatedAt.length ? new Date(lastUpdatedAt[0]) : undefined;
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

function getMatchesDescription(status: ReviewCommitState): boolean | undefined {
  return 'reviewed' in status
    ? status.reviewed.matches_description[0]
    : undefined;
}

function getSummary(status: ReviewCommitState): string | undefined {
  return 'reviewed' in status ? status.reviewed.comment[0] : undefined;
}

function getHighlights(status: ReviewCommitState): string | undefined {
  return 'reviewed' in status ? status.reviewed.highlights[0] : undefined;
}
