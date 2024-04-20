use crate::repositories::{ProposalReviewCommit, ProposalReviewCommitId, ReviewCommitState};

impl From<ReviewCommitState> for backend_api::ReviewCommitState {
    fn from(proposal_review_commit_state: ReviewCommitState) -> Self {
        match proposal_review_commit_state {
            ReviewCommitState::Reviewed {
                matches_description,
                comment,
                highlights,
            } => backend_api::ReviewCommitState::Reviewed {
                matches_description,
                comment,
                highlights,
            },
            ReviewCommitState::NotReviewed => backend_api::ReviewCommitState::NotReviewed,
        }
    }
}

impl From<backend_api::ReviewCommitState> for ReviewCommitState {
    fn from(proposal_review_commit_state: backend_api::ReviewCommitState) -> Self {
        match proposal_review_commit_state {
            backend_api::ReviewCommitState::Reviewed {
                matches_description,
                comment,
                highlights,
            } => ReviewCommitState::Reviewed {
                matches_description,
                comment,
                highlights,
            },
            backend_api::ReviewCommitState::NotReviewed => ReviewCommitState::NotReviewed,
        }
    }
}

impl From<ProposalReviewCommit> for backend_api::ProposalReviewCommit {
    fn from(proposal_review_commit: ProposalReviewCommit) -> Self {
        backend_api::ProposalReviewCommit {
            proposal_review_id: proposal_review_commit.proposal_review_id.to_string(),
            user_id: proposal_review_commit.user_id.to_string(),
            created_at: proposal_review_commit.created_at.to_string(),
            commit_sha: proposal_review_commit.commit_sha.to_string(),
            state: proposal_review_commit.state.into(),
        }
    }
}

pub fn map_proposal_review_commit(
    id: ProposalReviewCommitId,
    proposal_review_commit: ProposalReviewCommit,
) -> backend_api::ProposalReviewCommitWithId {
    backend_api::ProposalReviewCommitWithId {
        id: id.to_string(),
        proposal_review_commit: proposal_review_commit.into(),
    }
}

pub fn map_proposal_review_commits(
    proposal_review_commits: Vec<(ProposalReviewCommitId, ProposalReviewCommit)>,
) -> Vec<backend_api::ProposalReviewCommitWithId> {
    proposal_review_commits
        .into_iter()
        .map(|(id, proposal_review_commit)| map_proposal_review_commit(id, proposal_review_commit))
        .collect()
}
