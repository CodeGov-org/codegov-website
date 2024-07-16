use candid::{CandidType, Deserialize};
use ic_nns_governance::pb::v1::ProposalInfo;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum NervousSystem {
    #[serde(rename = "network")]
    Network {
        id: u64,
        proposal_info: ProposalInfo,
    },
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ReviewPeriodState {
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "completed")]
    Completed { completed_at: String },
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ReviewPeriodStateKey {
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "completed")]
    Completed,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct Proposal {
    pub nervous_system: NervousSystem,
    pub state: ReviewPeriodState,
    pub proposed_at: String,
    pub synced_at: String,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct GetProposalResponse {
    pub id: String,
    pub proposal: Proposal,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct ListProposalsRequest {
    pub state: Option<ReviewPeriodStateKey>,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct ListProposalsResponse {
    pub proposals: Vec<GetProposalResponse>,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct SyncProposalsResponse {
    pub synced_proposals_count: usize,
    pub completed_proposals_count: usize,
}
