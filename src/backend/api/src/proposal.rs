use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum NervousSystem {
    Network { id: u64, topic: NnsProposalTopic },
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum NnsProposalTopic {
    ReplicaVersionManagement,
    SystemCanisterManagement,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ReviewPeriodState {
    InProgress,
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
pub struct GetProposalsResponse {
    pub proposals: Vec<GetProposalResponse>,
}
