use rstest::*;

use crate::repositories::{ProposalReview, ProposalReviewStatus};

use super::{date_time_a, uuid};

#[fixture]
pub fn proposal_review_draft() -> ProposalReview {
    ProposalReview {
        proposal_id: uuid(),
        user_id: uuid(),
        created_at: date_time_a(),
        status: ProposalReviewStatus::Draft,
        summary: "Proposal review summary".to_string(),
        review_duration_mins: 60,
        build_reproduced: true,
        build_image_bytes: Some(vec![]),
    }
}

#[fixture]
pub fn proposal_review_published() -> ProposalReview {
    ProposalReview {
        proposal_id: uuid(),
        user_id: uuid(),
        created_at: date_time_a(),
        status: ProposalReviewStatus::Published,
        summary: "Proposal review summary".to_string(),
        review_duration_mins: 60,
        build_reproduced: true,
        build_image_bytes: Some(vec![]),
    }
}

#[fixture]
pub fn proposal_reviews() -> Vec<ProposalReview> {
    vec![proposal_review_draft(), proposal_review_published()]
}
