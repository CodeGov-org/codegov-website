use candid::{CandidType, Deserialize};

use crate::CreateImageRequest;

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
    pub last_updated_at: Option<String>,
    pub status: ProposalReviewStatus,
    pub summary: String,
    pub review_duration_mins: u16,
    pub build_reproduced: bool,
    pub reproduced_build_image_id: Option<String>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateProposalReviewRequest {
    pub proposal_id: String,
    pub summary: Option<String>,
    pub review_duration_mins: Option<u16>,
    pub build_reproduced: Option<bool>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateProposalReviewResponse {
    pub id: String,
    pub proposal_review: ProposalReview,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateProposalReviewRequest {
    pub proposal_id: String,
    pub status: Option<ProposalReviewStatus>,
    pub summary: Option<String>,
    pub review_duration_mins: Option<u16>,
    pub build_reproduced: Option<bool>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateProposalReviewImageRequest {
    pub proposal_id: String,
    pub content_type: String,
    pub content_bytes: Vec<u8>,
}

impl CreateImageRequest for CreateProposalReviewImageRequest {
    fn content_type(&self) -> String {
        self.content_type.clone()
    }

    fn content_bytes(&self) -> Vec<u8> {
        self.content_bytes.clone()
    }
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateProposalReviewImageResponse {
    pub path: String,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct DeleteProposalReviewImageRequest {
    pub proposal_id: String,
}
