use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ReviewCommitState {
    #[serde(rename = "reviewed")]
    Reviewed {
        matches_description: Option<bool>,
        comment: Option<String>,
        highlights: Vec<String>,
    },
    #[serde(rename = "not_reviewed")]
    NotReviewed,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct ProposalReviewCommit {
    pub proposal_review_id: String,
    pub user_id: String,
    pub created_at: String,
    pub last_updated_at: Option<String>,
    pub commit_sha: String,
    pub state: ReviewCommitState,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct ProposalReviewCommitWithId {
    pub id: String,
    pub proposal_review_commit: ProposalReviewCommit,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateProposalReviewCommitRequest {
    pub proposal_review_id: String,
    pub commit_sha: String,
    pub state: ReviewCommitState,
}

pub type CreateProposalReviewCommitResponse = ProposalReviewCommitWithId;

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateProposalReviewCommitRequest {
    pub id: String,
    pub state: ReviewCommitState,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct DeleteProposalReviewCommitRequest {
    pub id: String,
}
