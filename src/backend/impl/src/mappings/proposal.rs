use crate::repositories::{
    NervousSystem, Proposal, ProposalId, ReviewPeriodState, ReviewPeriodStateKey,
};
use backend_api::{ApiError, GetProposalResponse};

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
            ReviewPeriodState::Completed { completed_at } => {
                backend_api::ReviewPeriodState::Completed {
                    completed_at: completed_at.to_string(),
                }
            }
        }
    }
}

impl From<backend_api::ReviewPeriodStateKey> for ReviewPeriodStateKey {
    fn from(value: backend_api::ReviewPeriodStateKey) -> Self {
        match value {
            backend_api::ReviewPeriodStateKey::InProgress => ReviewPeriodStateKey::InProgress,
            backend_api::ReviewPeriodStateKey::Completed => ReviewPeriodStateKey::Completed,
        }
    }
}

impl TryFrom<Proposal> for backend_api::Proposal {
    type Error = ApiError;
    fn try_from(value: Proposal) -> Result<Self, ApiError> {
        Ok(backend_api::Proposal {
            nervous_system: value.nervous_system.clone().into(),
            state: value.state.into(),
            proposed_at: value.proposed_at()?.to_string(),
            synced_at: value.synced_at.to_string(),
        })
    }
}

pub fn map_get_proposal_response(
    proposal_id: ProposalId,
    proposal: Proposal,
) -> Result<GetProposalResponse, ApiError> {
    Ok(GetProposalResponse {
        id: proposal_id.to_string(),
        proposal: proposal.try_into()?,
    })
}
