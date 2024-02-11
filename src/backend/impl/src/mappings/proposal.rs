use crate::repositories::{
    NervousSystem, NnsProposalTopic, Proposal, ProposalId, ReviewPeriodState,
};
use backend_api::GetProposalResponse;

impl From<NnsProposalTopic> for backend_api::NnsProposalTopic {
    fn from(value: NnsProposalTopic) -> Self {
        match value {
            NnsProposalTopic::ReplicaVersionManagement => {
                backend_api::NnsProposalTopic::ReplicaVersionManagement
            }
            NnsProposalTopic::SystemCanisterManagement => {
                backend_api::NnsProposalTopic::SystemCanisterManagement
            }
        }
    }
}

impl From<NervousSystem> for backend_api::NervousSystem {
    fn from(value: NervousSystem) -> Self {
        match value {
            NervousSystem::Network { id, topic } => backend_api::NervousSystem::Network {
                id,
                topic: topic.into(),
            },
        }
    }
}

impl From<ReviewPeriodState> for backend_api::ReviewPeriodState {
    fn from(value: ReviewPeriodState) -> Self {
        match value {
            ReviewPeriodState::InProgress => backend_api::ReviewPeriodState::InProgress,
            ReviewPeriodState::Completed => backend_api::ReviewPeriodState::Completed,
        }
    }
}

impl From<Proposal> for backend_api::Proposal {
    fn from(value: Proposal) -> Self {
        backend_api::Proposal {
            title: value.title,
            nervous_system: value.nervous_system.into(),
            state: value.state.into(),
            proposed_at: value.proposed_at.to_string(),
            proposed_by: value.proposed_by,
            synced_at: value.synced_at.to_string(),
            review_completed_at: value.review_completed_at.map(|dt| dt.to_string()),
        }
    }
}

pub fn map_get_proposal_response(
    proposal_id: ProposalId,
    proposal: Proposal,
) -> GetProposalResponse {
    GetProposalResponse {
        id: proposal_id.to_string(),
        proposal: proposal.into(),
    }
}
