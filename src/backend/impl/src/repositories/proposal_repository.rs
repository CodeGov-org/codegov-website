use crate::system_api::get_date_time;

use super::{
    init_proposal_timestamp_index, init_proposals_nervous_system_id_index,
    init_proposals_status_timestamp_index,
    memories::{init_proposals, ProposalMemory},
    DateTime, NervousSystemId, NervousSystemProposalId, Proposal, ProposalId,
    ProposalNervousSystemIdIndexMemory, ProposalNervousSystemIdKey, ProposalNervousSystemIdRange,
    ProposalStatusTimestampIndexMemory, ProposalStatusTimestampKey, ProposalStatusTimestampRange,
    ProposalTimestampIndexMemory, ProposalTimestampKey, ProposalTimestampRange, ReviewPeriodState,
};
use backend_api::ApiError;
use std::cell::RefCell;

#[cfg_attr(test, mockall::automock)]
pub trait ProposalRepository {
    fn get_proposal_by_id(&self, proposal_id: &ProposalId) -> Option<Proposal>;

    fn get_proposal_by_nervous_system_id(
        &self,
        nervous_system_id: NervousSystemId,
        nervous_system_proposal_id: NervousSystemProposalId,
    ) -> Option<Proposal>;

    fn get_proposals(
        &self,
        state: Option<ReviewPeriodState>,
    ) -> Result<Vec<(ProposalId, Proposal)>, ApiError>;

    async fn create_proposal(&self, proposal: Proposal) -> Result<ProposalId, ApiError>;

    fn update_proposal(&self, proposal_id: ProposalId, proposal: Proposal) -> Result<(), ApiError>;

    fn complete_pending_proposals(&self, current_time: DateTime) -> Result<(), ApiError>;

    fn complete_proposal_by_id(&self, proposal_id: ProposalId) -> Result<(), ApiError>;
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

    fn get_proposal_by_nervous_system_id(
        &self,
        nervous_system_id: NervousSystemId,
        nervous_system_proposal_id: NervousSystemProposalId,
    ) -> Option<Proposal> {
        // we can just return None if the range is invalid
        let range =
            ProposalNervousSystemIdRange::new(nervous_system_id, nervous_system_proposal_id)
                .ok()?;

        STATE.with_borrow(|s| {
            s.proposals_nervous_system_id_index
                .range(range)
                .filter_map(|(_, id)| s.proposals.get(&id))
                .next()
        })
    }

    fn get_proposals(
        &self,
        state: Option<ReviewPeriodState>,
    ) -> Result<Vec<(ProposalId, Proposal)>, ApiError> {
        let mut proposals: Vec<(ProposalId, Proposal)> = STATE.with_borrow(|s| match state {
            Some(state) => {
                let range = ProposalStatusTimestampRange::new(state)?;

                Ok(s.proposals_status_timestamp_index
                    .range(range)
                    .map(|(_, id)| (id, s.proposals.get(&id).unwrap()))
                    .collect())
            }
            None => {
                let range = ProposalTimestampRange::new()?;

                Ok(s.proposals_timestamp_index
                    .range(range)
                    .map(|(_, id)| (id, s.proposals.get(&id).unwrap()))
                    .collect())
            }
        })?;

        proposals.reverse();

        Ok(proposals)
    }

    fn complete_pending_proposals(&self, current_time: DateTime) -> Result<(), ApiError> {
        let range = ProposalStatusTimestampRange::new(ReviewPeriodState::InProgress)?;

        let pending_proposals = STATE.with_borrow_mut(|s| {
            s.proposals_status_timestamp_index
                .range(range)
                .filter_map(|(_, id)| {
                    s.proposals
                        .get(&id)
                        .and_then(|proposal| proposal.is_pending(&current_time).then_some(id))
                })
                .collect::<Vec<_>>()
        });

        for proposal_id in pending_proposals {
            self.complete_proposal_by_id(proposal_id)?;
        }

        Ok(())
    }

    fn complete_proposal_by_id(&self, proposal_id: ProposalId) -> Result<(), ApiError> {
        let proposal = self.get_proposal_by_id(&proposal_id).ok_or_else(|| {
            ApiError::not_found(&format!(
                "Proposal with Id {} not found",
                proposal_id.to_string()
            ))
        })?;

        if proposal.is_completed() {
            return Err(ApiError::conflict(&format!(
                "Proposal with Id {} is already completed",
                proposal_id.to_string()
            )));
        }

        let current_time = get_date_time()?;

        self.update_proposal(
            proposal_id,
            Proposal {
                state: ReviewPeriodState::Completed,
                review_completed_at: Some(DateTime::new(current_time)?),
                ..proposal
            },
        )
    }

    async fn create_proposal(&self, proposal: Proposal) -> Result<ProposalId, ApiError> {
        let proposal_id = ProposalId::new().await?;
        let proposal_proposed_at = proposal.proposed_at()?;
        let proposal_status_key = ProposalStatusTimestampKey::new(
            proposal.state.into(),
            proposal_proposed_at,
            proposal_id,
        )?;
        let proposal_timestamp_key = ProposalTimestampKey::new(proposal_proposed_at, proposal_id)?;

        let nervous_system_id = proposal.nervous_system.nervous_system_id();
        let nervous_system_proposal_id = proposal.nervous_system.proposal_id();

        if self
            .get_proposal_by_nervous_system_id(nervous_system_id, nervous_system_proposal_id)
            .is_some()
        {
            return Err(ApiError::conflict(&format!(
                "Proposal with nervous system id {} and nervous system proposal id {} already exists",
                nervous_system_id, nervous_system_proposal_id
            )));
        }

        let proposal_nervous_system_id_key = ProposalNervousSystemIdKey::new(
            nervous_system_id,
            nervous_system_proposal_id,
            proposal_id,
        )?;

        STATE.with_borrow_mut(|s| {
            s.proposals.insert(proposal_id, proposal);
            s.proposals_status_timestamp_index
                .insert(proposal_status_key, proposal_id);
            s.proposals_nervous_system_id_index
                .insert(proposal_nervous_system_id_key, proposal_id);
            s.proposals_timestamp_index
                .insert(proposal_timestamp_key, proposal_id);
        });

        Ok(proposal_id)
    }

    fn update_proposal(&self, proposal_id: ProposalId, proposal: Proposal) -> Result<(), ApiError> {
        let existing_proposal = self.get_proposal_by_id(&proposal_id).ok_or_else(|| {
            ApiError::not_found(&format!(
                "Proposal with id {} not found",
                proposal_id.to_string()
            ))
        })?;

        if existing_proposal.nervous_system.nervous_system_id()
            != proposal.nervous_system.nervous_system_id()
        {
            return Err(ApiError::conflict(
                "Updated proposal has a different nervous system id",
            ));
        }
        if existing_proposal.nervous_system.proposal_id() != proposal.nervous_system.proposal_id() {
            return Err(ApiError::conflict(
                "Updated proposal has a different nervous system proposal id",
            ));
        }

        STATE.with_borrow_mut(|s| {
            if existing_proposal.state != proposal.state {
                let old_status_key = ProposalStatusTimestampKey::new(
                    existing_proposal.state.into(),
                    existing_proposal.proposed_at()?,
                    proposal_id,
                )?;
                let new_status_key = ProposalStatusTimestampKey::new(
                    proposal.state.into(),
                    proposal.proposed_at()?,
                    proposal_id,
                )?;
                s.proposals_status_timestamp_index.remove(&old_status_key);
                s.proposals_status_timestamp_index
                    .insert(new_status_key, proposal_id);
            }

            s.proposals.insert(proposal_id, proposal);

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
    proposals_status_timestamp_index: ProposalStatusTimestampIndexMemory,
    proposals_nervous_system_id_index: ProposalNervousSystemIdIndexMemory,
    proposals_timestamp_index: ProposalTimestampIndexMemory,
}

impl Default for ProposalState {
    fn default() -> Self {
        Self {
            proposals: init_proposals(),
            proposals_status_timestamp_index: init_proposals_status_timestamp_index(),
            proposals_nervous_system_id_index: init_proposals_nervous_system_id_index(),
            proposals_timestamp_index: init_proposal_timestamp_index(),
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
        repositories::NervousSystem,
        system_api::get_date_time,
    };
    use chrono::Duration;
    use rstest::*;

    #[rstest]
    #[case::nns_proposal(fixtures::nns_replica_version_management_proposal(None, None))]
    async fn create_and_get_proposal_by_id(#[case] proposal: Proposal) {
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();
        let proposal_id = repository.create_proposal(proposal.clone()).await.unwrap();

        let result = repository.get_proposal_by_id(&proposal_id).unwrap();

        assert_eq!(result, proposal);
    }

    #[rstest]
    #[case::nns_proposal(fixtures::nns_replica_version_management_proposal(None, None))]
    async fn create_proposal_duplicate(#[case] proposal: Proposal) {
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();
        repository.create_proposal(proposal.clone()).await.unwrap();

        let result = repository
            .create_proposal(proposal.clone())
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal with nervous system id {} and nervous system proposal id {} already exists",
                proposal.nervous_system.nervous_system_id(), proposal.nervous_system.proposal_id()
            )),
        );
    }

    #[rstest]
    #[case::sorted_proposals_all((sorted_proposals(), None))]
    #[case::unsorted_proposals_all((unsorted_proposals(), None))]
    #[case::sorted_proposals_in_progress((sorted_proposals(), Some(ReviewPeriodState::InProgress)))]
    #[case::unsorted_proposals_in_progress((unsorted_proposals(), Some(ReviewPeriodState::InProgress)))]
    #[case::sorted_proposals_completed((sorted_proposals(), Some(ReviewPeriodState::Completed)))]
    #[case::unsorted_proposals_completed((unsorted_proposals(), Some(ReviewPeriodState::Completed)))]
    async fn get_proposals(#[case] inputs: (Vec<Proposal>, Option<ReviewPeriodState>)) {
        STATE.set(ProposalState::default());

        let (input_proposals, state) = inputs;

        let repository = ProposalRepositoryImpl::default();

        for proposal in input_proposals {
            repository.create_proposal(proposal.clone()).await.unwrap();
        }

        let result = repository.get_proposals(state).unwrap();
        let proposals = result.into_iter().map(|(_, p)| p).collect::<Vec<_>>();

        let expected_proposals = match state {
            Some(state) => sorted_proposals()
                .into_iter()
                .filter(|p| p.state == state)
                .collect(),
            None => sorted_proposals(),
        };

        assert_eq!(proposals, expected_proposals);
    }

    #[fixture]
    fn sorted_proposals() -> Vec<Proposal> {
        vec![
            fixtures::nns_replica_version_management_proposal(Some(date_time_a()), Some(130400)),
            fixtures::nns_replica_version_management_proposal_completed(
                Some(date_time_a().sub(Duration::seconds(1))),
                Some(130399),
            ),
            fixtures::nns_replica_version_management_proposal(Some(date_time_b()), Some(130398)),
            fixtures::nns_replica_version_management_proposal_completed(
                Some(date_time_b().sub(Duration::seconds(1))),
                Some(130397),
            ),
            fixtures::nns_replica_version_management_proposal(Some(date_time_c()), Some(130396)),
            fixtures::nns_replica_version_management_proposal_completed(
                Some(date_time_c().sub(Duration::seconds(1))),
                Some(130395),
            ),
        ]
    }

    #[fixture]
    fn unsorted_proposals() -> Vec<Proposal> {
        sorted_proposals().into_iter().rev().collect()
    }

    #[rstest]
    async fn get_proposal_by_nervous_system_id() {
        STATE.set(ProposalState::default());

        let proposals = fixtures::nns_proposals();

        let repository = ProposalRepositoryImpl::default();

        for proposal in proposals.iter() {
            repository.create_proposal(proposal.clone()).await.unwrap();
        }

        for proposal in proposals {
            let result = repository
                .get_proposal_by_nervous_system_id(
                    proposal.nervous_system.nervous_system_id(),
                    proposal.nervous_system.proposal_id(),
                )
                .unwrap();
            assert_eq!(result, proposal);
        }
    }

    #[rstest]
    async fn complete_pending_proposals() {
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();
        let current_time = DateTime::new(get_date_time().unwrap()).unwrap();

        let proposals = proposals_with_pending();
        for proposal in proposals {
            repository.create_proposal(proposal).await.unwrap();
        }

        repository.complete_pending_proposals(current_time).unwrap();

        let in_progress_result = repository
            .get_proposals(Some(ReviewPeriodState::InProgress))
            .unwrap();
        let completed_result = repository
            .get_proposals(Some(ReviewPeriodState::Completed))
            .unwrap();

        assert_eq!(in_progress_result.len(), 4);
        assert_eq!(completed_result.len(), 2);
    }

    #[fixture]
    fn proposals_with_pending() -> Vec<Proposal> {
        let current_time = get_date_time().unwrap();

        vec![
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time).unwrap()),
                    Some(130400),
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time - Duration::hours(12)).unwrap()),
                    Some(130399),
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time - Duration::hours(24)).unwrap()),
                    Some(130398),
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time - Duration::hours(36)).unwrap()),
                    Some(130397),
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(
                        DateTime::new(current_time - Duration::hours(48) - Duration::minutes(1))
                            .unwrap(),
                    ),
                    Some(130396),
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time - Duration::hours(60)).unwrap()),
                    Some(130395),
                )
            },
        ]
    }

    #[rstest]
    async fn update_proposal() {
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();

        let proposal = fixtures::nns_replica_version_management_proposal(None, None);
        let updated_proposal = Proposal {
            state: ReviewPeriodState::Completed,
            ..proposal.clone()
        };

        let proposal_id = repository.create_proposal(proposal.clone()).await.unwrap();
        repository
            .update_proposal(proposal_id, updated_proposal.clone())
            .unwrap();

        let result = repository.get_proposal_by_id(&proposal_id).unwrap();
        assert_eq!(result, updated_proposal);
        assert_ne!(result, proposal);
    }

    #[rstest]
    #[case(proposal_update_nervous_system_proposal_id_change())]
    async fn update_proposal_with_different_nervous_system_proposal_id(
        #[case] inputs: (Proposal, Proposal, ApiError),
    ) {
        let (proposal, updated_proposal, expected_error) = inputs;
        STATE.set(ProposalState::default());

        let repository = ProposalRepositoryImpl::default();

        let proposal_id = repository.create_proposal(proposal).await.unwrap();
        let result = repository
            .update_proposal(proposal_id, updated_proposal)
            .unwrap_err();
        assert_eq!(result, expected_error);
    }

    #[fixture]
    fn proposal_update_nervous_system_proposal_id_change() -> (Proposal, Proposal, ApiError) {
        let proposal = fixtures::nns_replica_version_management_proposal(None, None);
        (
            proposal.clone(),
            Proposal {
                nervous_system: {
                    let NervousSystem::Network { proposal_info, .. } = proposal.nervous_system;
                    NervousSystem::Network {
                        proposal_id: 1,
                        proposal_info,
                    }
                },
                ..proposal
            },
            ApiError::conflict("Updated proposal has a different nervous system proposal id"),
        )
    }
}
