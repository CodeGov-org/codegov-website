use std::str::FromStr;

use crate::{
    mappings::map_get_proposal_response,
    repositories::{
        DateTime, Proposal, ProposalId, ProposalRepository, ProposalRepositoryImpl,
        ReviewPeriodState,
    },
    system_api::get_date_time,
};
use backend_api::{ApiError, GetProposalResponse, ListProposalsRequest, ListProposalsResponse};
use candid::Principal;
use external_canisters::nns::GovernanceCanisterService;
use ic_nns_common::pb::v1::ProposalId as NnsProposalId;
use ic_nns_governance::pb::v1::{ListProposalInfo, ProposalInfo, ProposalStatus, Topic};

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

    async fn fetch_and_save_nns_proposals(&self) -> Result<(usize, usize), ApiError>;

    fn complete_pending_proposals(&self) -> Result<usize, ApiError>;
}

pub struct ProposalServiceImpl<T: ProposalRepository> {
    proposal_repository: T,
}

impl Default for ProposalServiceImpl<ProposalRepositoryImpl> {
    fn default() -> Self {
        Self::new(ProposalRepositoryImpl::default())
    }
}

impl<T: ProposalRepository> ProposalService for ProposalServiceImpl<T> {
    fn get_proposal(&self, id: ProposalId) -> Result<GetProposalResponse, ApiError> {
        let proposal = self
            .proposal_repository
            .get_proposal_by_id(&id)
            .ok_or_else(|| {
                ApiError::not_found(&format!("Proposal with id {} not found", &id.to_string()))
            })?;

        Ok(map_get_proposal_response(id, proposal))
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
            .collect();

        Ok(ListProposalsResponse { proposals })
    }

    async fn fetch_and_save_nns_proposals(&self) -> Result<(usize, usize), ApiError> {
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

        for nns_proposal in proposals.iter() {
            let proposal = Proposal::try_from(nns_proposal.clone())?;

            match self.proposal_repository.get_proposal_by_nervous_system_id(
                proposal.nervous_system.nervous_system_id(),
                proposal.nervous_system.proposal_id(),
            ) {
                Some((id, existing_proposal)) => {
                    self.proposal_repository.update_proposal(
                        id,
                        Proposal {
                            // only patch the proposal info and the synced_at field
                            nervous_system: proposal.nervous_system.clone(),
                            synced_at: proposal.synced_at,
                            ..existing_proposal
                        },
                    )?;
                }
                None => {
                    self.proposal_repository.create_proposal(proposal).await?;
                }
            }
        }

        let completed_proposals_count = self
            .fetch_and_complete_missing_proposals(&proposals)
            .await?;

        Ok((proposals.len(), completed_proposals_count))
    }

    fn complete_pending_proposals(&self) -> Result<usize, ApiError> {
        let current_time = get_date_time().and_then(DateTime::new)?;

        self.proposal_repository
            .complete_pending_proposals(current_time)
    }
}

impl<T: ProposalRepository> ProposalServiceImpl<T> {
    fn new(proposal_repository: T) -> Self {
        Self {
            proposal_repository,
        }
    }

    async fn fetch_and_complete_missing_proposals(
        &self,
        nns_proposals: &[ProposalInfo],
    ) -> Result<usize, ApiError> {
        let in_progress_proposals = self
            .proposal_repository
            .get_proposals(Some(ReviewPeriodState::InProgress))?;
        let missing_proposals: Vec<(ProposalId, Proposal)> = in_progress_proposals
            .iter()
            .filter_map(|(internal_id, proposal)| {
                let proposal_id = proposal.nervous_system.proposal_id();
                let is_missing = nns_proposals
                    .iter()
                    .all(|p| p.id.map_or(true, |nns_id| nns_id.id != proposal_id));
                if is_missing {
                    Some((*internal_id, proposal.clone()))
                } else {
                    None
                }
            })
            .collect();

        for (id, existing_proposal) in missing_proposals.iter() {
            let proposal_info =
                fetch_proposal_info(existing_proposal.nervous_system.proposal_id()).await?;
            let proposal = Proposal::try_from(proposal_info)?;

            self.proposal_repository.update_proposal(
                *id,
                Proposal {
                    nervous_system: proposal.nervous_system.clone(),
                    synced_at: proposal.synced_at,
                    // overwrite the state if the fetched proposal
                    // is not open anymore (expected)
                    state: if proposal.is_completed() {
                        proposal.state
                    } else {
                        existing_proposal.state
                    },
                    // overwrite the review_completed_at if the fetched proposal
                    // is not open anymore (expected) and the existing proposal does not have it
                    review_completed_at: if proposal.is_completed()
                        && existing_proposal.review_completed_at.is_none()
                    {
                        proposal.review_completed_at
                    } else {
                        existing_proposal.review_completed_at
                    },
                },
            )?;
        }

        Ok(missing_proposals.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        repositories::{DateTime, MockProposalRepository},
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

        let service = ProposalServiceImpl::new(repository_mock);

        let result = service.get_proposal(proposal_id).unwrap();

        assert_eq!(
            result,
            GetProposalResponse {
                id: proposal_id.to_string(),
                proposal: proposal.into(),
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

        let service = ProposalServiceImpl::new(repository_mock);

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

        let service = ProposalServiceImpl::new(repository_mock);

        let expected: Vec<_> = fixtures::nns_proposals_with_ids()
            .into_iter()
            .rev()
            .map(|(id, proposal)| map_get_proposal_response(id, proposal))
            .collect();

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

        let service = ProposalServiceImpl::new(repository_mock);

        let result = service.complete_pending_proposals().unwrap();
        assert_eq!(result, completed_proposals_count);
    }
}
