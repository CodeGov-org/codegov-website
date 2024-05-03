use super::{
    init_proposals_status_timestamp_index,
    memories::{init_proposals, ProposalMemory},
    DateTime, Proposal, ProposalId, ProposalStatusTimestampIndexMemory, ProposalStatusTimestampKey,
    ProposalStatusTimestampRange, ReviewPeriodState,
};
use backend_api::ApiError;
use std::cell::RefCell;

#[cfg_attr(test, mockall::automock)]
pub trait ProposalRepository {
    fn get_proposal_by_id(&self, proposal_id: &ProposalId) -> Option<Proposal>;

    fn get_proposals(
        &self,
        state: Option<ReviewPeriodState>,
    ) -> Result<Vec<(ProposalId, Proposal)>, ApiError>;

    async fn create_proposal(&self, proposal: Proposal) -> Result<ProposalId, ApiError>;

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

    fn get_proposals(
        &self,
        state: Option<ReviewPeriodState>,
    ) -> Result<Vec<(ProposalId, Proposal)>, ApiError> {
        let range = ProposalStatusTimestampRange::new(state)?;

        let proposals = STATE.with_borrow(|s| {
            s.proposals_status_timestamp_index
                .range(range)
                .map(|(_, id)| (id, s.proposals.get(&id).unwrap()))
                .collect()
        });

        Ok(proposals)
    }

    fn complete_pending_proposals(&self, current_time: DateTime) -> Result<(), ApiError> {
        let range = ProposalStatusTimestampRange::new(ReviewPeriodState::InProgress.into())?;

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

        STATE.with_borrow_mut(|s| {
            let old_key = ProposalStatusTimestampKey::new(
                ReviewPeriodState::InProgress.into(),
                proposal.proposed_at()?,
                proposal_id,
            )?;
            let new_key = ProposalStatusTimestampKey::new(
                ReviewPeriodState::Completed.into(),
                proposal.proposed_at()?,
                proposal_id,
            )?;

            s.proposals_status_timestamp_index.remove(&old_key);
            s.proposals_status_timestamp_index
                .insert(new_key, proposal_id);

            s.proposals.insert(
                proposal_id,
                Proposal {
                    state: ReviewPeriodState::Completed,
                    ..proposal
                },
            );

            Ok(())
        })
    }

    async fn create_proposal(&self, proposal: Proposal) -> Result<ProposalId, ApiError> {
        let proposal_id = ProposalId::new().await?;
        let proposal_status_key = ProposalStatusTimestampKey::new(
            proposal.state.into(),
            proposal.proposed_at()?,
            proposal_id,
        )?;

        STATE.with_borrow_mut(|s| {
            s.proposals.insert(proposal_id, proposal);
            s.proposals_status_timestamp_index
                .insert(proposal_status_key, proposal_id);
        });

        Ok(proposal_id)
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
}

impl Default for ProposalState {
    fn default() -> Self {
        Self {
            proposals: init_proposals(),
            proposals_status_timestamp_index: init_proposals_status_timestamp_index(),
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
        system_api::get_date_time,
    };
    use chrono::Duration;
    use rstest::*;

    #[rstest]
    #[case::nns_proposal(fixtures::nns_replica_version_management_proposal(None))]
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

        let result = repository.get_proposals(None).unwrap();
        let proposals = result.into_iter().map(|(_, p)| p).collect::<Vec<_>>();

        assert_eq!(proposals, sorted_proposals());
    }

    #[fixture]
    fn sorted_proposals() -> Vec<Proposal> {
        vec![
            fixtures::nns_replica_version_management_proposal(Some(date_time_c())),
            fixtures::nns_replica_version_management_proposal(Some(date_time_b())),
            fixtures::nns_replica_version_management_proposal(Some(date_time_a())),
        ]
    }

    #[fixture]
    fn unsorted_proposals() -> Vec<Proposal> {
        sorted_proposals().into_iter().rev().collect()
    }

    #[rstest]
    async fn get_all_proposals() {
        STATE.set(ProposalState::default());

        let proposals = proposals_with_state();
        let repository = ProposalRepositoryImpl::default();

        for proposal in proposals.clone() {
            repository.create_proposal(proposal).await.unwrap();
        }

        let result = repository.get_proposals(None).unwrap();

        assert_eq!(result.len(), proposals.len());
    }

    #[rstest]
    async fn get_in_progress_proposals() {
        STATE.set(ProposalState::default());

        let proposals = proposals_with_state();
        let repository = ProposalRepositoryImpl::default();

        for proposal in proposals {
            repository.create_proposal(proposal).await.unwrap();
        }

        let result = repository
            .get_proposals(Some(ReviewPeriodState::InProgress))
            .unwrap();

        assert_eq!(result.len(), 2);
        for (_, proposal) in result {
            assert_eq!(proposal.state, ReviewPeriodState::InProgress);
        }
    }

    #[rstest]
    async fn get_completed_proposals() {
        STATE.set(ProposalState::default());

        let proposals = proposals_with_state();
        let repository = ProposalRepositoryImpl::default();

        for proposal in proposals {
            repository.create_proposal(proposal).await.unwrap();
        }

        let result = repository
            .get_proposals(Some(ReviewPeriodState::Completed))
            .unwrap();

        assert_eq!(result.len(), 2);
        for (_, proposal) in result {
            assert_eq!(proposal.state, ReviewPeriodState::Completed);
        }
    }

    #[fixture]
    fn proposals_with_state() -> Vec<Proposal> {
        vec![
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(None)
            },
            Proposal {
                state: ReviewPeriodState::Completed,
                ..fixtures::nns_replica_version_management_proposal(None)
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(None)
            },
            Proposal {
                state: ReviewPeriodState::Completed,
                ..fixtures::nns_replica_version_management_proposal(None)
            },
        ]
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
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time).unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(12)).unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(24)).unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(36)).unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(48) - Duration::minutes(1))
                        .unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(60)).unwrap(),
                ))
            },
        ]
    }
}
