use super::{
    init_proposals_sorted_index,
    memories::{init_proposals, ProposalMemory},
    Proposal, ProposalId, ProposalIndex, ProposalSortedIndexMemory,
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
        STATE.with_borrow(|s| {
            s.proposals_sorted_index
                .iter()
                .map(|((_, id), _)| (id, s.proposals.get(&id).unwrap()))
                .collect()
        })
    }

    async fn create_proposal(&self, proposal: Proposal) -> Result<ProposalId, ApiError> {
        let proposal_id = ProposalId::new().await?;
        let proposal_index: ProposalIndex = (proposal.clone().proposed_at, proposal_id);

        STATE.with_borrow_mut(|s| {
            s.proposals.insert(proposal_id, proposal);
            s.proposals_sorted_index.insert(proposal_index, ());
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
    proposals_sorted_index: ProposalSortedIndexMemory,
}

impl Default for ProposalState {
    fn default() -> Self {
        Self {
            proposals: init_proposals(),
            proposals_sorted_index: init_proposals_sorted_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<ProposalState> = RefCell::new(ProposalState::default());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures::{self, date_time_a, date_time_b, date_time_c},
        repositories::ReviewPeriodState,
    };
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
    #[case::sorted_proposals(sorted_proposals())]
    #[case::unsorted_proposals(unsorted_proposals())]
    async fn get_proposals(#[case] fixtures: Vec<Proposal>) {
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();

        for proposal in fixtures {
            repository.create_proposal(proposal.clone()).await.unwrap();
        }

        let result = repository.get_proposals();
        let proposals = result.into_iter().map(|(_, p)| p).collect::<Vec<_>>();

        assert_eq!(proposals, sorted_proposals());
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

    #[fixture]
    fn sorted_proposals() -> Vec<Proposal> {
        vec![
            Proposal {
                proposed_at: date_time_c(),
                ..fixtures::nns_replica_version_management_proposal()
            },
            Proposal {
                proposed_at: date_time_b(),
                ..fixtures::nns_replica_version_management_proposal()
            },
            Proposal {
                proposed_at: date_time_a(),
                ..fixtures::nns_replica_version_management_proposal()
            },
        ]
    }

    #[fixture]
    fn unsorted_proposals() -> Vec<Proposal> {
        sorted_proposals().into_iter().rev().collect()
    }
}
