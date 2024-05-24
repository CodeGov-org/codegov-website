use rstest::*;

use crate::repositories::{ProposalReview, ProposalReviewStatus};

use super::{date_time_a, proposal_id, user_id, uuid};

#[fixture]
pub fn proposal_review_draft() -> ProposalReview {
    ProposalReview {
        proposal_id: proposal_id(),
        user_id: user_id(),
        created_at: date_time_a(),
        last_updated_at: None,
        status: ProposalReviewStatus::Draft,
        summary: Some("Proposal review summary".to_string()),
        review_duration_mins: Some(60),
        build_reproduced: Some(true),
        reproduced_build_image_id: None,
    }
}

#[fixture]
pub fn proposal_review_published() -> ProposalReview {
    ProposalReview {
        proposal_id: proposal_id(),
        user_id: user_id(),
        created_at: date_time_a(),
        last_updated_at: None,
        status: ProposalReviewStatus::Published,
        summary: Some("Proposal review summary".to_string()),
        review_duration_mins: Some(60),
        build_reproduced: Some(true),
        reproduced_build_image_id: Some(uuid()),
    }
}

#[fixture]
pub fn proposal_reviews() -> Vec<ProposalReview> {
    vec![proposal_review_draft(), proposal_review_published()]
}
