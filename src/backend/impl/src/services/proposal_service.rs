use std::str::FromStr;

use crate::{
    mappings::map_get_proposal_response,
    repositories::{
        DateTime, LogRepositoryImpl, NervousSystem, Proposal, ProposalId, ProposalRepository,
        ProposalRepositoryImpl, ReviewPeriodState, ReviewPeriodStateKey,
    },
    system_api::get_date_time,
};
use backend_api::{
    ApiError, GetProposalResponse, ListProposalsRequest, ListProposalsResponse,
    SyncProposalsResponse,
};
use candid::Principal;
use external_canisters::nns::GovernanceCanisterService;
use ic_nns_common::pb::v1::ProposalId as NnsProposalId;
use ic_nns_governance::pb::v1::{ListProposalInfo, ProposalInfo, ProposalStatus, Topic};

use super::{LogService, LogServiceImpl};

const NNS_GOVERNANCE_CANISTER_ID: &str = "rrkah-fqaaa-aaaaa-aaaaq-cai";

async fn fetch_open_nns_proposals(
    before_proposal: Option<NnsProposalId>,
) -> Result<Vec<ProposalInfo>, ApiError> {
    GovernanceCanisterService(Principal::from_str(NNS_GOVERNANCE_CANISTER_ID).unwrap())
        .list_proposals(ListProposalInfo {
            include_reward_status: vec![],
            omit_large_fields: Some(true),
            before_proposal,
            limit: LIST_PROPOSALS_LIMIT,
            // only fetch for:
            // - NetworkCanisterManagement
            // - ReplicaVersionManagement
            exclude_topic: vec![
                Topic::Unspecified,
                Topic::NeuronManagement,
                Topic::ExchangeRate,
                Topic::NetworkEconomics,
                Topic::Governance,
                Topic::NodeAdmin,
                Topic::ParticipantManagement,
                Topic::SubnetManagement,
                Topic::Kyc,
                Topic::NodeProviderRewards,
                Topic::SnsDecentralizationSale,
                Topic::SubnetReplicaVersionManagement,
                Topic::SnsAndCommunityFund,
                Topic::ApiBoundaryNodeManagement,
            ]
            .into_iter()
            .map(Into::into)
            .collect(),
            include_all_manage_neuron_proposals: Some(false),
            include_status: vec![ProposalStatus::Open]
                .into_iter()
                .map(Into::into)
                .collect(),
        })
        .await
        .map(|res| res.proposal_info)
        .map_err(|err| ApiError::internal(&format!("Failed to fetch proposals: {:?}", err)))
}

async fn fetch_proposal_info(proposal_id: u64) -> Result<ProposalInfo, ApiError> {
    GovernanceCanisterService(Principal::from_str(NNS_GOVERNANCE_CANISTER_ID).unwrap())
        .get_proposal_info(proposal_id)
        .await
        .map_err(|err| ApiError::internal(&format!("Failed to fetch proposal info: {:?}", err)))
        .and_then(|res| res.ok_or_else(|| ApiError::not_found("Proposal not found")))
}

const LIST_PROPOSALS_LIMIT: u32 = 50;

#[cfg_attr(test, mockall::automock)]
pub trait ProposalService {
    fn get_proposal(&self, id: ProposalId) -> Result<GetProposalResponse, ApiError>;

    fn list_proposals(
        &self,
        request: ListProposalsRequest,
    ) -> Result<ListProposalsResponse, ApiError>;

    async fn fetch_and_save_nns_proposals(&self) -> Result<SyncProposalsResponse, ApiError>;

    fn complete_pending_proposals(&self) -> Result<usize, ApiError>;
}

pub struct ProposalServiceImpl<T: ProposalRepository, L: LogService> {
    proposal_repository: T,
    log_service: L,
}

impl Default for ProposalServiceImpl<ProposalRepositoryImpl, LogServiceImpl<LogRepositoryImpl>> {
    fn default() -> Self {
        Self::new(ProposalRepositoryImpl::default(), LogServiceImpl::default())
    }
}

impl<T: ProposalRepository, L: LogService> ProposalService for ProposalServiceImpl<T, L> {
    fn get_proposal(&self, id: ProposalId) -> Result<GetProposalResponse, ApiError> {
        let proposal = self
            .proposal_repository
            .get_proposal_by_id(&id)
            .ok_or_else(|| {
                ApiError::not_found(&format!("Proposal with id {} not found", &id.to_string()))
            })?;

        map_get_proposal_response(id, proposal)
    }

    fn list_proposals(
        &self,
        request: ListProposalsRequest,
    ) -> Result<ListProposalsResponse, ApiError> {
        let proposal_state = request.state.map(Into::into);

        let proposals = self
            .proposal_repository
            .get_proposals(proposal_state)?
            .into_iter()
            .rev()
            .map(|(id, proposal)| map_get_proposal_response(id, proposal))
            .collect::<Result<Vec<_>, _>>()?;

        Ok(ListProposalsResponse { proposals })
    }

    async fn fetch_and_save_nns_proposals(&self) -> Result<SyncProposalsResponse, ApiError> {
        // recursively fetch all proposals until the canister returns less proposals than the limit
        let mut proposals = vec![];
        let mut before_proposal = None;
        loop {
            let fetched_proposals = fetch_open_nns_proposals(before_proposal).await?;
            proposals.extend(fetched_proposals.clone());
            if fetched_proposals.len() < LIST_PROPOSALS_LIMIT as usize {
                break;
            }
            before_proposal = fetched_proposals.last().and_then(|p| p.id);
        }

        let current_time = get_date_time().and_then(DateTime::new)?;

        for nns_proposal in proposals.iter() {
            let nervous_system = match NervousSystem::try_from(nns_proposal.clone()) {
                Ok(ns) => ns,
                Err(err) => {
                    let _ = self.log_service.log_error(
                        err.to_string(),
                        Some("fetch_and_save_nns_proposals".to_string()),
                    );
                    continue;
                }
            };

            match self.proposal_repository.get_proposal_by_nervous_system_id(
                nervous_system.nervous_system_id(),
                nervous_system.proposal_id(),
            ) {
                Some((id, existing_proposal)) => {
                    self.proposal_repository.update_proposal(
                        id,
                        Proposal {
                            // only patch the proposal info and the synced_at field
                            nervous_system,
                            synced_at: current_time,
                            ..existing_proposal
                        },
                    )?;
                }
                None => {
                    if let Err(err) = self
                        .proposal_repository
                        .create_proposal(Proposal {
                            nervous_system,
                            synced_at: current_time,
                            state: ReviewPeriodState::InProgress,
                        })
                        .await
                    {
                        let _ = self.log_service.log_error(
                            format!("Failed to create proposal: {err}"),
                            Some("fetch_and_save_nns_proposals".to_string()),
                        );
                        // TODO: count failed proposals
                    };
                }
            }
        }

        let completed_proposals_count =
            match self.fetch_and_complete_missing_proposals(&proposals).await {
                Ok(count) => count,
                Err(err) => {
                    let _ = self.log_service.log_error(
                        format!("Failed to complete missing proposals: {err}"),
                        Some("fetch_and_save_nns_proposals".to_string()),
                    );
                    0
                }
            };

        Ok(SyncProposalsResponse {
            synced_proposals_count: proposals.len(),
            completed_proposals_count,
        })
    }

    fn complete_pending_proposals(&self) -> Result<usize, ApiError> {
        let current_time = get_date_time().and_then(DateTime::new)?;

        self.proposal_repository
            .complete_pending_proposals(current_time)
    }
}

impl<T: ProposalRepository, L: LogService> ProposalServiceImpl<T, L> {
    fn new(proposal_repository: T, log_service: L) -> Self {
        Self {
            proposal_repository,
            log_service,
        }
    }

    async fn fetch_and_complete_missing_proposals(
        &self,
        nns_proposals: &[ProposalInfo],
    ) -> Result<usize, ApiError> {
        let in_progress_proposals = self
            .proposal_repository
            .get_proposals(Some(ReviewPeriodStateKey::InProgress))?;
        let missing_proposals: Vec<(ProposalId, Proposal)> = in_progress_proposals
            .into_iter()
            .filter_map(|(internal_id, proposal)| {
                let proposal_id = proposal.nervous_system.proposal_id();
                let already_exists = nns_proposals
                    .iter()
                    .any(|p| p.id.map_or(false, |nns_id| nns_id.id == proposal_id));
                if already_exists {
                    None
                } else {
                    Some((internal_id, proposal))
                }
            })
            .collect();

        let missing_proposals_len = missing_proposals.len();

        for (id, existing_proposal) in missing_proposals.into_iter() {
            if let Err(err) = fetch_proposal_info(existing_proposal.nervous_system.proposal_id())
                .await
                .and_then(NervousSystem::try_from)
                .and_then(|nervous_system| {
                    let current_time = get_date_time().and_then(DateTime::new)?;
                    self.proposal_repository.update_proposal(
                        id,
                        Proposal {
                            nervous_system: nervous_system.clone(),
                            synced_at: current_time,
                            ..existing_proposal
                        },
                    )
                })
            {
                let _ = self.log_service.log_error(
                    format!("Failed to complete missing proposal: {err}"),
                    Some("fetch_and_complete_missing_proposals".to_string()),
                );
                // TODO: count failed cases and return them to the caller
            }
        }

        Ok(missing_proposals_len)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        repositories::{DateTime, MockProposalRepository},
        services::MockLogService,
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    async fn get_proposal() {
        let proposal_id = fixtures::proposal_id();
        let proposal = fixtures::nns_replica_version_management_proposal(None, None);

        let mut repository_mock = MockProposalRepository::new();
        repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(Some(proposal.clone()));
        let log_service_mock = MockLogService::new();

        let service = ProposalServiceImpl::new(repository_mock, log_service_mock);

        let result = service.get_proposal(proposal_id).unwrap();

        assert_eq!(
            result,
            GetProposalResponse {
                id: proposal_id.to_string(),
                proposal: proposal.try_into().unwrap(),
            },
        )
    }

    #[rstest]
    async fn get_proposal_not_found() {
        let proposal_id = fixtures::proposal_id();

        let mut repository_mock = MockProposalRepository::new();
        repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(None);
        let log_service_mock = MockLogService::new();

        let service = ProposalServiceImpl::new(repository_mock, log_service_mock);

        let result = service.get_proposal(proposal_id).unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "Proposal with id {} not found",
                &proposal_id.to_string()
            ))
        )
    }

    #[rstest]
    fn list_proposals() {
        let mut repository_mock = MockProposalRepository::new();
        repository_mock
            .expect_get_proposals()
            .once()
            .return_const(Ok(fixtures::nns_proposals_with_ids()));
        let log_service_mock = MockLogService::new();

        let service = ProposalServiceImpl::new(repository_mock, log_service_mock);

        let expected = fixtures::nns_proposals_with_ids()
            .into_iter()
            .rev()
            .map(|(id, proposal)| map_get_proposal_response(id, proposal))
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        let result = service
            .list_proposals(ListProposalsRequest { state: None })
            .unwrap();

        assert_eq!(
            result,
            ListProposalsResponse {
                proposals: expected
            }
        );
    }

    #[rstest]
    fn complete_pending_proposals() {
        let current_time: DateTime = get_date_time().and_then(DateTime::new).unwrap();
        let completed_proposals_count = 2;

        let mut repository_mock = MockProposalRepository::new();
        repository_mock
            .expect_complete_pending_proposals()
            .once()
            .with(eq(current_time))
            .return_const(Ok(completed_proposals_count));
        let log_service_mock = MockLogService::new();

        let service = ProposalServiceImpl::new(repository_mock, log_service_mock);

        let result = service.complete_pending_proposals().unwrap();
        assert_eq!(result, completed_proposals_count);
    }
}
