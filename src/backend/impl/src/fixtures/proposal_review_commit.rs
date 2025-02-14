use rstest::*;

use crate::repositories::{ProposalReviewCommit, ReviewCommitState, ReviewedCommitState};

use super::{commit_sha_a, commit_sha_b, date_time_a, proposal_review_id, user_id};

#[fixture]
pub fn proposal_review_commit_reviewed() -> ProposalReviewCommit {
    ProposalReviewCommit {
        proposal_review_id: proposal_review_id(),
        user_id: user_id(),
        created_at: date_time_a(),
        last_updated_at: None,
        commit_sha: commit_sha_a(),
        state: ReviewCommitState::Reviewed(ReviewedCommitState {
            matches_description: Some(true),
            comment: Some("Review commit comment".to_string()),
        }),
    }
}

#[fixture]
pub fn proposal_review_commit_not_reviewed() -> ProposalReviewCommit {
    ProposalReviewCommit {
        proposal_review_id: proposal_review_id(),
        user_id: user_id(),
        created_at: date_time_a(),
        last_updated_at: None,
        commit_sha: commit_sha_b(),
        state: ReviewCommitState::NotReviewed,
    }
}
