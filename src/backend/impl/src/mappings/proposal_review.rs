use crate::repositories::{
    ProposalReview, ProposalReviewCommit, ProposalReviewCommitId, ProposalReviewId,
    ProposalReviewStatus, ProposalVote,
};

use super::map_proposal_review_commits;

impl From<ProposalReviewStatus> for backend_api::ProposalReviewStatus {
    fn from(proposal_review_status: ProposalReviewStatus) -> Self {
        match proposal_review_status {
            ProposalReviewStatus::Draft => backend_api::ProposalReviewStatus::Draft,
            ProposalReviewStatus::Published => backend_api::ProposalReviewStatus::Published,
        }
    }
}

impl From<backend_api::ProposalReviewStatus> for ProposalReviewStatus {
    fn from(proposal_review_status: backend_api::ProposalReviewStatus) -> Self {
        match proposal_review_status {
            backend_api::ProposalReviewStatus::Draft => ProposalReviewStatus::Draft,
            backend_api::ProposalReviewStatus::Published => ProposalReviewStatus::Published,
        }
    }
}

impl From<backend_api::ProposalVote> for ProposalVote {
    fn from(vote: backend_api::ProposalVote) -> Self {
        match vote {
            backend_api::ProposalVote::Unspecified => ProposalVote::Unspecified,
            backend_api::ProposalVote::Yes => ProposalVote::Yes,
            backend_api::ProposalVote::No => ProposalVote::No,
        }
    }
}

impl From<ProposalVote> for backend_api::ProposalVote {
    fn from(vote: ProposalVote) -> Self {
        match vote {
            ProposalVote::Unspecified => backend_api::ProposalVote::Unspecified,
            ProposalVote::Yes => backend_api::ProposalVote::Yes,
            ProposalVote::No => backend_api::ProposalVote::No,
        }
    }
}

impl From<ProposalReview> for backend_api::ProposalReview {
    fn from(proposal_review: ProposalReview) -> Self {
        backend_api::ProposalReview {
            proposal_id: proposal_review.proposal_id.to_string(),
            user_id: proposal_review.user_id.to_string(),
            created_at: proposal_review.created_at.to_string(),
            last_updated_at: proposal_review.last_updated_at.map(|dt| dt.to_string()),
            status: proposal_review.status.into(),
            summary: proposal_review.summary,
            build_reproduced: proposal_review.build_reproduced,
            images_paths: vec![],
            proposal_review_commits: vec![],
            vote: proposal_review.vote.into(),
        }
    }
}

pub fn map_proposal_review(
    id: ProposalReviewId,
    proposal_review: ProposalReview,
    proposal_review_commits: Vec<(ProposalReviewCommitId, ProposalReviewCommit)>,
    images_paths: Vec<String>,
) -> backend_api::ProposalReviewWithId {
    backend_api::ProposalReviewWithId {
        id: id.to_string(),
        proposal_review: backend_api::ProposalReview {
            proposal_review_commits: map_proposal_review_commits(proposal_review_commits),
            images_paths,
            ..proposal_review.into()
        },
    }
}
