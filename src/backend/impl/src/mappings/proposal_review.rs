use backend_api::CreateProposalReviewResponse;

use crate::repositories::{ProposalReview, ProposalReviewId, ProposalReviewStatus};

impl From<ProposalReviewStatus> for backend_api::ProposalReviewStatus {
    fn from(proposal_review_status: ProposalReviewStatus) -> Self {
        match proposal_review_status {
            ProposalReviewStatus::Draft => backend_api::ProposalReviewStatus::Draft,
            ProposalReviewStatus::Published => backend_api::ProposalReviewStatus::Published,
        }
    }
}

impl From<ProposalReview> for backend_api::ProposalReview {
    fn from(proposal_review: ProposalReview) -> Self {
        backend_api::ProposalReview {
            proposal_id: proposal_review.proposal_id.to_string(),
            user_id: proposal_review.user_id.to_string(),
            created_at: proposal_review.created_at.to_string(),
            status: proposal_review.status.into(),
            summary: proposal_review.summary,
            review_duration_mins: proposal_review.review_duration_mins,
            build_reproduced: proposal_review.build_reproduced,
            reproduced_build_image_id: proposal_review
                .reproduced_build_image_id
                .map(|id| id.to_string()),
        }
    }
}

pub fn map_create_proposal_review_response(
    id: ProposalReviewId,
    proposal_review: ProposalReview,
) -> CreateProposalReviewResponse {
    CreateProposalReviewResponse {
        id: id.to_string(),
        proposal_review: proposal_review.into(),
    }
}
