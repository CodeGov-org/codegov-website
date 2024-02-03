use super::{
    memories::{init_proposals, ProposalMemory},
    Proposal, ProposalId,
};
use backend_api::ApiError;
use std::cell::RefCell;

#[cfg_attr(test, mockall::automock)]
pub trait ProposalRepository {
    fn get_proposal_by_id(&self, proposal_id: &ProposalId) -> Option<Proposal>;

    fn get_proposals(&self) -> Vec<(ProposalId, Proposal)>;

    async fn create_proposal(&self, proposal: Proposal) -> Result<ProposalId, ApiError>;

    fn update_proposal(&self, proposal_id: &ProposalId, proposal: Proposal)
        -> Result<(), ApiError>;
}

pub struct ProposalRepositoryImpl {}

impl Default for ProposalRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl ProposalRepository for ProposalRepositoryImpl {
    fn get_proposal_by_id(&self, proposal_id: &ProposalId) -> Option<Proposal> {
        STATE.with_borrow(|s| s.proposals.get(proposal_id))
    }

    fn get_proposals(&self) -> Vec<(ProposalId, Proposal)> {
        STATE.with_borrow(|s| s.proposals.iter().collect())
    }

    async fn create_proposal(&self, proposal: Proposal) -> Result<ProposalId, ApiError> {
        let proposal_id = ProposalId::new().await?;

        STATE.with_borrow_mut(|s| {
            s.proposals.insert(proposal_id, proposal);
        });

        Ok(proposal_id)
    }

    fn update_proposal(
        &self,
        proposal_id: &ProposalId,
        proposal: Proposal,
    ) -> Result<(), ApiError> {
        self.get_proposal_by_id(proposal_id).ok_or_else(|| {
            ApiError::not_found(&format!(
                "Proposal with id {} not found",
                proposal_id.to_string()
            ))
        })?;

        STATE.with_borrow_mut(|s| {
            s.proposals.insert(*proposal_id, proposal);

            Ok(())
        })
    }
}

impl ProposalRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct ProposalState {
    proposals: ProposalMemory,
}

impl Default for ProposalState {
    fn default() -> Self {
        Self {
            proposals: init_proposals(),
        }
    }
}

thread_local! {
    static STATE: RefCell<ProposalState> = RefCell::new(ProposalState::default());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{fixtures, repositories::ReviewPeriodState};
    use rstest::*;

    #[rstest]
    #[case::nns_proposal(fixtures::nns_replica_version_management_proposal())]
    async fn create_and_get_proposal_by_id(#[case] proposal: Proposal) {
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();
        let proposal_id = repository.create_proposal(proposal.clone()).await.unwrap();

        let result = repository.get_proposal_by_id(&proposal_id);

        assert_eq!(result, Some(proposal));
    }

    #[rstest]
    async fn get_proposals() {
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();

        let mut expected: Vec<(ProposalId, Proposal)> = vec![];
        for proposal in fixtures::nns_proposals() {
            let id = repository.create_proposal(proposal.clone()).await.unwrap();

            expected.push((id, proposal));
        }

        let result = repository.get_proposals();

        assert_eq!(result, expected);
    }

    #[rstest]
    #[case::nns_proposal(
        fixtures::nns_replica_version_management_proposal(),
        updated_proposal()
    )]
    async fn update_proposal_state(
        #[case] original_proposal: Proposal,
        #[case] updated_proposal: Proposal,
    ) {
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();
        let proposal_id = repository
            .create_proposal(original_proposal.clone())
            .await
            .unwrap();

        repository
            .update_proposal(&proposal_id, updated_proposal.clone())
            .unwrap();

        let result = repository.get_proposal_by_id(&proposal_id);

        assert_eq!(result, Some(updated_proposal),);
    }

    #[fixture]
    fn updated_proposal() -> Proposal {
        Proposal {
            state: ReviewPeriodState::Completed,
            ..fixtures::nns_replica_version_management_proposal()
        }
    }
}
