use crate::repositories::{NervousSystem, Proposal, ProposalId, ReviewPeriodState};
use backend_api::GetProposalResponse;

impl From<NervousSystem> for backend_api::NervousSystem {
    fn from(value: NervousSystem) -> Self {
        match value {
            NervousSystem::Network {
                proposal_id,
                proposal_info,
            } => backend_api::NervousSystem::Network {
                id: proposal_id,
                proposal_info,
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

impl From<backend_api::ReviewPeriodState> for ReviewPeriodState {
    fn from(value: backend_api::ReviewPeriodState) -> Self {
        match value {
            backend_api::ReviewPeriodState::InProgress => ReviewPeriodState::InProgress,
            backend_api::ReviewPeriodState::Completed => ReviewPeriodState::Completed,
        }
    }
}

impl From<Proposal> for backend_api::Proposal {
    fn from(value: Proposal) -> Self {
        backend_api::Proposal {
            nervous_system: value.nervous_system.clone().into(),
            state: value.state.into(),
            proposed_at: value.proposed_at().unwrap().to_string(),
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
