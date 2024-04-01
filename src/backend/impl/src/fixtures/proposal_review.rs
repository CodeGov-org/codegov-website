use rstest::*;

use crate::repositories::{ProposalReview, ProposalReviewStatus};

use super::{date_time_a, proposal_id, user_id, uuid};

#[fixture]
pub fn proposal_review_draft() -> ProposalReview {
    ProposalReview {
        proposal_id: proposal_id(),
        user_id: user_id(),
        created_at: date_time_a(),
        status: ProposalReviewStatus::Draft,
        summary: "Proposal review summary".to_string(),
        review_duration_mins: 60,
        build_reproduced: true,
        reproduced_build_image_id: None,
    }
}

#[fixture]
pub fn proposal_review_published() -> ProposalReview {
    ProposalReview {
        proposal_id: proposal_id(),
        user_id: user_id(),
        created_at: date_time_a(),
        status: ProposalReviewStatus::Published,
        summary: "Proposal review summary".to_string(),
        review_duration_mins: 60,
        build_reproduced: true,
        reproduced_build_image_id: Some(uuid()),
    }
}

#[fixture]
pub fn proposal_reviews() -> Vec<ProposalReview> {
    vec![proposal_review_draft(), proposal_review_published()]
}
