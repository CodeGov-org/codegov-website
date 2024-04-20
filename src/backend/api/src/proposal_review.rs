use candid::{CandidType, Deserialize};

use crate::ProposalReviewCommitWithId;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ProposalReviewStatus {
    #[serde(rename = "draft")]
    Draft,
    #[serde(rename = "published")]
    Published,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct ProposalReview {
    pub proposal_id: String,
    pub user_id: String,
    pub created_at: String,
    pub status: ProposalReviewStatus,
    pub summary: String,
    pub review_duration_mins: u16,
    pub build_reproduced: bool,
    pub reproduced_build_image_id: Option<String>,
    pub proposal_review_commits: Vec<ProposalReviewCommitWithId>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct ProposalReviewWithId {
    pub id: String,
    pub proposal_review: ProposalReview,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateProposalReviewRequest {
    pub proposal_id: String,
    pub summary: Option<String>,
    pub review_duration_mins: Option<u16>,
    pub build_reproduced: Option<bool>,
    pub reproduced_build_image_id: Option<String>,
}

pub type CreateProposalReviewResponse = ProposalReviewWithId;

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateProposalReviewRequest {
    pub proposal_id: String,
    pub status: Option<ProposalReviewStatus>,
    pub summary: Option<String>,
    pub review_duration_mins: Option<u16>,
    pub build_reproduced: Option<bool>,
    pub reproduced_build_image_id: Option<String>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct ListProposalReviewsRequest {
    pub proposal_id: Option<String>,
    pub user_id: Option<String>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct ListProposalReviewsResponse {
    pub proposal_reviews: Vec<ProposalReviewWithId>,
}
