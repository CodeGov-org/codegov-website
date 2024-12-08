use candid::{CandidType, Deserialize};

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct GetMyProposalReviewSummaryRequest {
    pub proposal_id: String,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct GetMyProposalReviewSummaryResponse {
    pub summary_markdown: String,
}
