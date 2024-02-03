use crate::{
    repositories::{LogRepositoryImpl, ProposalRepositoryImpl, UserProfileRepositoryImpl},
    services::{
        AccessControlService, AccessControlServiceImpl, LogService, LogServiceImpl,
        ProposalService, ProposalServiceImpl,
    },
};
use backend_api::{ApiError, ApiResult, GetProposalsResponse};
use candid::Principal;
use ic_cdk::*;

#[update]
async fn sync_proposals() -> ApiResult<()> {
    let calling_principal = caller();

    ProposalController::default()
        .sync_proposals(calling_principal)
        .await
        .into()
}

#[query]
fn get_proposals() -> ApiResult<GetProposalsResponse> {
    ProposalController::default().get_proposals().into()
}

pub(super) struct ProposalController<A: AccessControlService, L: LogService, P: ProposalService> {
    access_control_service: A,
    log_service: L,
    proposal_service: P,
}

impl Default
    for ProposalController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        LogServiceImpl<LogRepositoryImpl>,
        ProposalServiceImpl<ProposalRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(
            AccessControlServiceImpl::default(),
            LogServiceImpl::default(),
            ProposalServiceImpl::default(),
        )
    }
}

impl<A: AccessControlService, L: LogService, P: ProposalService> ProposalController<A, L, P> {
    fn new(access_control_service: A, log_service: L, proposal_service: P) -> Self {
        Self {
            access_control_service,
            log_service,
            proposal_service,
        }
    }

    async fn sync_proposals(&self, calling_principal: Principal) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_admin(calling_principal)?;

        self.proposal_service.fetch_and_save_nns_proposals().await
    }

    pub async fn sync_proposals_job(&self) {
        match self.proposal_service.fetch_and_save_nns_proposals().await {
            Ok(_) => {
                let _ = self.log_service.log_info(
                    "Successfully synced proposals".to_string(),
                    Some("sync_proposals".to_string()),
                );
            }
            Err(e) => {
                let _ = self
                    .log_service
                    .log_error(format!("{:?}", e), Some("sync_proposals".to_string()));
            }
        }
    }

    fn get_proposals(&self) -> Result<GetProposalsResponse, ApiError> {
        self.proposal_service.get_proposals()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        mappings::map_get_proposal_response,
        services::{MockAccessControlService, MockLogService, MockProposalService},
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    #[case::anonymous_principal(Principal::anonymous())]
    #[case::non_admin_principal(fixtures::principal())]
    async fn sync_proposals_unauthorized(#[case] calling_principal: Principal) {
        let error = ApiError::permission_denied(&format!(
            "Principal {} must be an admin to call this endpoint",
            &calling_principal.to_text()
        ));

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_admin()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(error.clone()));

        let log_service_mock = MockLogService::new();
        let mut proposal_service_mock = MockProposalService::new();
        proposal_service_mock
            .expect_fetch_and_save_nns_proposals()
            .never();

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        let result = controller
            .sync_proposals(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(result, error);
    }

    #[rstest]
    async fn sync_proposals() {
        let calling_principal = fixtures::principal();

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_admin()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let log_service_mock = MockLogService::new();
        let mut proposal_service_mock = MockProposalService::new();
        proposal_service_mock
            .expect_fetch_and_save_nns_proposals()
            .once()
            .return_const(Ok(()));

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        let result = controller.sync_proposals(calling_principal).await;

        assert!(result.is_ok());
    }

    #[rstest]
    fn get_proposals() {
        let proposals: Vec<_> = fixtures::nns_proposals_with_ids()
            .into_iter()
            .map(|(id, proposal)| map_get_proposal_response(id, proposal))
            .collect();

        let access_control_service_mock = MockAccessControlService::new();
        let log_service_mock = MockLogService::new();
        let mut proposal_service_mock = MockProposalService::new();
        proposal_service_mock
            .expect_get_proposals()
            .once()
            .return_const(Ok(GetProposalsResponse {
                proposals: proposals.clone(),
            }));

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        let result = controller.get_proposals().unwrap();

        assert_eq!(result, GetProposalsResponse { proposals });
    }
}
