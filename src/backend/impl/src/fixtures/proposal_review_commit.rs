use rstest::*;

use crate::repositories::ProposalReviewCommit;

use super::{date_time_a, proposal_review_id, user_id};

#[fixture]
pub fn proposal_review_commit_reviewed() -> ProposalReviewCommit {
    ProposalReviewCommit {
        proposal_review_id: proposal_review_id(),
        user_id: user_id(),
        created_at: date_time_a(),
        commit_sha: "28111ed23e35353ce852a0ae939eb2bd131ede49".to_string(),
        is_reviewed: true,
        matches_description: true,
        comment: Some("Review commit comment".to_string()),
        highlights: vec![],
    }
}

#[fixture]
pub fn proposal_review_commit_not_reviewed() -> ProposalReviewCommit {
    ProposalReviewCommit {
        proposal_review_id: proposal_review_id(),
        user_id: user_id(),
        created_at: date_time_a(),
        commit_sha: "fb2d88ec72a78233cfc0333bbddbd8880a0d584a".to_string(),
        is_reviewed: false,
        matches_description: false,
        comment: None,
        highlights: vec![],
    }
}
