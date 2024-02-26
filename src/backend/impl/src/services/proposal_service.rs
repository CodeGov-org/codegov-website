use std::str::FromStr;

use crate::{
    mappings::map_get_proposal_response,
    repositories::{DateTime, Proposal, ProposalId, ProposalRepository, ProposalRepositoryImpl},
    system_api::get_date_time,
};
use backend_api::{ApiError, GetProposalResponse, ListProposalsRequest, ListProposalsResponse};
use candid::Principal;
use external_canisters::nns::GovernanceCanisterService;
use ic_nns_governance::pb::v1::{
    ListProposalInfo, ListProposalInfoResponse, ProposalStatus, Topic,
};

const NNS_GOVERNANCE_CANISTER_ID: &str = "rrkah-fqaaa-aaaaa-aaaaq-cai";

#[cfg_attr(test, mockall::automock)]
pub trait ProposalService {
    fn get_proposal(&self, id: ProposalId) -> Result<GetProposalResponse, ApiError>;

    fn list_proposals(
        &self,
        request: Option<ListProposalsRequest>,
    ) -> Result<ListProposalsResponse, ApiError>;

    async fn fetch_and_save_nns_proposals(&self) -> Result<(), ApiError>;

    fn complete_pending_proposals(&self) -> Result<(), ApiError>;
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
        request: Option<ListProposalsRequest>,
    ) -> Result<ListProposalsResponse, ApiError> {
        let proposal_state = request.and_then(|r| r.state.map(Into::into));

        let proposals = self
            .proposal_repository
            .get_proposals(proposal_state)?
            .into_iter()
            .map(|(id, proposal)| map_get_proposal_response(id, proposal))
            .collect();

        Ok(ListProposalsResponse { proposals })
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
                limit: 50,
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
            Ok(res) => res,
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

            if !self
                .proposal_repository
                .get_proposals(None)?
                .iter()
                .any(|(_, p)| p.nervous_system.id() == proposal.nervous_system.id())
            {
                self.proposal_repository.create_proposal(proposal).await?;
            }
        }

        Ok(())
    }

    fn complete_pending_proposals(&self) -> Result<(), ApiError> {
        let current_time = get_date_time().and_then(DateTime::new)?;

        self.proposal_repository
            .complete_pending_proposals(current_time)?;

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
        fixtures,
        repositories::{DateTime, MockProposalRepository},
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
            .map(|(id, proposal)| map_get_proposal_response(id, proposal))
            .collect();

        let result = service.list_proposals(None).unwrap();

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

        let mut repository_mock = MockProposalRepository::new();
        repository_mock
            .expect_complete_pending_proposals()
            .once()
            .with(eq(current_time))
            .return_const(Ok(()));

        let service = ProposalServiceImpl::new(repository_mock);

        service.complete_pending_proposals().unwrap();
    }
}
