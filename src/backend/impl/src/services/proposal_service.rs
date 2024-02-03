use std::str::FromStr;

use crate::{
    mappings::map_get_proposal_response,
    repositories::{
        Proposal, ProposalId, ProposalRepository, ProposalRepositoryImpl, ReviewPeriodState,
    },
};
use backend_api::{ApiError, GetProposalResponse};
use candid::Principal;
use external_canisters::nns::GovernanceCanisterService;
use ic_nns_governance::pb::v1::{
    ListProposalInfo, ListProposalInfoResponse, ProposalStatus, Topic,
};

const NNS_GOVERNANCE_CANISTER_ID: &str = "rrkah-fqaaa-aaaaa-aaaaq-cai";

#[cfg_attr(test, mockall::automock)]
pub trait ProposalService {
    fn get_proposal(&self, id: ProposalId) -> Result<GetProposalResponse, ApiError>;

    fn update_proposal_state(
        &self,
        id: ProposalId,
        state: ReviewPeriodState,
    ) -> Result<(), ApiError>;

    async fn fetch_and_save_nns_proposals(&self) -> Result<(), ApiError>;
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

    fn update_proposal_state(
        &self,
        id: ProposalId,
        state: ReviewPeriodState,
    ) -> Result<(), ApiError> {
        let mut proposal = self
            .proposal_repository
            .get_proposal_by_id(&id)
            .ok_or_else(|| {
                ApiError::not_found(&format!("Proposal with id {} not found", &id.to_string()))
            })?;

        match (proposal.state, state.clone()) {
            (ReviewPeriodState::InProgress, ReviewPeriodState::Completed) => {
                proposal.state = state;

                self.proposal_repository.update_proposal(&id, proposal)
            }
            _ => Err(ApiError::invalid_argument(
                "Invalid proposal state transition",
            )),
        }
    }

    async fn fetch_and_save_nns_proposals(&self) -> Result<(), ApiError> {
        let nns_governance_canister =
            GovernanceCanisterService(Principal::from_str(NNS_GOVERNANCE_CANISTER_ID).unwrap());

        let ListProposalInfoResponse {
            proposal_info: proposals,
        } = match nns_governance_canister
            .list_proposals(ListProposalInfo {
                include_reward_status: vec![],
                omit_large_fields: Some(true),
                before_proposal: None,
                limit: 10,
                exclude_topic: vec![
                    Topic::Unspecified.into(),
                    Topic::NeuronManagement.into(),
                    Topic::ExchangeRate.into(),
                    Topic::NetworkEconomics.into(),
                    Topic::Governance.into(),
                    Topic::NodeAdmin.into(),
                    Topic::ParticipantManagement.into(),
                    Topic::SubnetManagement.into(),
                    Topic::Kyc.into(),
                    Topic::NodeProviderRewards.into(),
                    Topic::SnsDecentralizationSale.into(),
                    Topic::SubnetReplicaVersionManagement.into(),
                    Topic::SnsAndCommunityFund.into(),
                    Topic::ApiBoundaryNodeManagement.into(),
                ],
                include_all_manage_neuron_proposals: Some(false),
                include_status: vec![ProposalStatus::Open.into()],
            })
            .await
        {
            Ok(response) => response.0,
            Err(err) => {
                return Err(ApiError::internal(&format!(
                    "Failed to fetch proposals: {:?}",
                    err
                )))
            }
        };

        for nns_proposal in proposals {
            let proposal = match Proposal::try_from(nns_proposal) {
                Ok(proposal) => proposal,
                Err(err) => {
                    return Err(ApiError::internal(&format!(
                        "Failed to map NNS proposal: {:?}",
                        err
                    )))
                }
            };
            self.proposal_repository.create_proposal(proposal).await?;
        }

        Ok(())
    }
}

impl<T: ProposalRepository> ProposalServiceImpl<T> {
    fn new(proposal_repository: T) -> Self {
        Self {
            proposal_repository,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures::{self},
        repositories::{MockProposalRepository, Proposal},
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    async fn get_proposal() {
        let proposal_id = fixtures::proposal_id();
        let proposal = fixtures::nns_replica_version_management_proposal();

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
    fn update_proposal_state() {
        let proposal_id = fixtures::proposal_id();
        let original_proposal = fixtures::nns_replica_version_management_proposal();
        let state = ReviewPeriodState::Completed;

        let updated_proposal = Proposal {
            state: state.clone(),
            ..fixtures::nns_replica_version_management_proposal()
        };

        let mut repository_mock = MockProposalRepository::new();
        repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(Some(original_proposal.clone()));
        repository_mock
            .expect_update_proposal()
            .once()
            .with(eq(proposal_id), eq(updated_proposal))
            .return_const(Ok(()));

        let service = ProposalServiceImpl::new(repository_mock);

        service.update_proposal_state(proposal_id, state).unwrap();
    }

    #[rstest]
    fn update_proposal_state_wrong() {
        let proposal_id = fixtures::proposal_id();
        let original_proposal = fixtures::nns_replica_version_management_proposal_completed();
        let state = ReviewPeriodState::InProgress;

        let mut repository_mock = MockProposalRepository::new();
        repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(Some(original_proposal.clone()));
        repository_mock.expect_update_proposal().never();

        let service = ProposalServiceImpl::new(repository_mock);

        let result = service
            .update_proposal_state(proposal_id, state)
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::invalid_argument("Invalid proposal state transition",)
        )
    }
}
