use candid::{CandidType, Deserialize};

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
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateProposalReviewRequest {
    pub proposal_id: String,
    pub summary: String,
    pub review_duration_mins: u16,
    pub build_reproduced: bool,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateProposalReviewResponse {
    pub id: String,
    pub proposal_review: ProposalReview,
}
