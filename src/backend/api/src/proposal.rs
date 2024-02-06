use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum NervousSystem {
    #[serde(rename = "network")]
    Network { id: u64, topic: NnsProposalTopic },
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum NnsProposalTopic {
    #[serde(rename = "replica_version_management")]
    ReplicaVersionManagement,
    #[serde(rename = "system_canister_management")]
    SystemCanisterManagement,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ReviewPeriodState {
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "completed")]
    Completed,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct Proposal {
    pub title: String,
    pub nervous_system: NervousSystem,
    pub state: ReviewPeriodState,
    pub proposed_at: String,
    pub proposed_by: u64,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct GetProposalResponse {
    pub id: String,
    pub proposal: Proposal,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct ListProposalsResponse {
    pub proposals: Vec<GetProposalResponse>,
}
