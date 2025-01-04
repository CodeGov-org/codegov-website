use crate::{
    repositories::{LogRepositoryImpl, ProposalRepositoryImpl, UserProfileRepositoryImpl},
    services::{
        AccessControlService, AccessControlServiceImpl, LogService, LogServiceImpl,
        ProposalService, ProposalServiceImpl,
    },
};
use backend_api::{
    ApiError, ApiResult, ListProposalsRequest, ListProposalsResponse, SyncProposalsResponse,
};
use candid::Principal;
use ic_cdk::*;

#[update]
async fn sync_proposals() -> ApiResult<SyncProposalsResponse> {
    let calling_principal = caller();

    ProposalController::default()
        .sync_proposals(calling_principal)
        .await
        .into()
}

#[query]
fn list_proposals(request: ListProposalsRequest) -> ApiResult<ListProposalsResponse> {
    ProposalController::default().list_proposals(request).into()
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
        ProposalServiceImpl<ProposalRepositoryImpl, LogServiceImpl<LogRepositoryImpl>>,
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

    async fn sync_proposals(
        &self,
        calling_principal: Principal,
    ) -> Result<SyncProposalsResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.proposal_service.fetch_and_save_nns_proposals().await
    }

    pub async fn sync_proposals_job(&self) {
        let _ = self.log_service.log_info(
            "Syncing proposals".to_string(),
            Some("sync_proposals".to_string()),
        );

        match self.proposal_service.fetch_and_save_nns_proposals().await {
            Ok(SyncProposalsResponse {
                synced_proposals_count,
                completed_proposals_count,
            }) => {
                let _ = self.log_service.log_info(
                    format!("Successfully synced {synced_proposals_count} proposals and completed {completed_proposals_count} proposals"),
                    Some("sync_proposals".to_string()),
                );
            }
            Err(e) => {
                let _ = self.log_service.log_error(
                    format!("Error syncing proposals ({})", e),
                    Some("sync_proposals".to_string()),
                );
            }
        }
    }

    pub fn complete_pending_proposals_job(&self) {
        let _ = self.log_service.log_info(
            "Closing proposals".to_string(),
            Some("complete_pending_proposals".to_string()),
        );

        match self.proposal_service.complete_pending_proposals() {
            Ok(count) => {
                let _ = self.log_service.log_info(
                    format!("Successfully closed {count} completed proposals"),
                    Some("complete_pending_proposals".to_string()),
                );
            }
            Err(e) => {
                let _ = self.log_service.log_error(
                    format!("Error closing completed proposals ({})", e),
                    Some("complete_pending_proposals".to_string()),
                );
            }
        }
    }

    fn list_proposals(
        &self,
        request: ListProposalsRequest,
    ) -> Result<ListProposalsResponse, ApiError> {
        self.proposal_service.list_proposals(request)
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
    #[case::non_admin_principal(fixtures::principal_a())]
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
        let calling_principal = fixtures::principal_a();
        let synced_proposals_count = 2;
        let completed_proposals_count = 1;

        let expected_result = SyncProposalsResponse {
            synced_proposals_count,
            completed_proposals_count,
        };

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
            .return_const(Ok(expected_result.clone()));

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        let result = controller.sync_proposals(calling_principal).await.unwrap();
        assert_eq!(result, expected_result);
    }

    #[rstest]
    fn list_proposals() {
        let proposals = fixtures::nns_proposals_with_ids()
            .into_iter()
            .map(|(id, proposal)| map_get_proposal_response(id, proposal))
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        let access_control_service_mock = MockAccessControlService::new();
        let log_service_mock = MockLogService::new();
        let mut proposal_service_mock = MockProposalService::new();
        proposal_service_mock
            .expect_list_proposals()
            .once()
            .return_const(Ok(ListProposalsResponse {
                proposals: proposals.clone(),
            }));

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        let result = controller
            .list_proposals(ListProposalsRequest { state: None })
            .unwrap();

        assert_eq!(result, ListProposalsResponse { proposals });
    }

    #[rstest]
    async fn sync_proposals_success() {
        let access_control_service_mock = MockAccessControlService::new();
        let synced_proposals_count = 2;
        let completed_proposals_count = 1;

        let mut log_service_mock = MockLogService::new();
        log_service_mock
            .expect_log_info()
            .once()
            .with(
                eq("Syncing proposals".to_string()),
                eq(Some("sync_proposals".to_string())),
            )
            .return_const(Ok(()));
        log_service_mock
            .expect_log_info()
            .once()
            .with(
                eq(format!(
                    "Successfully synced {synced_proposals_count} proposals and completed {completed_proposals_count} proposals"
                )),
                eq(Some("sync_proposals".to_string())),
            )
            .return_const(Ok(()));

        let mut proposal_service_mock = MockProposalService::new();
        proposal_service_mock
            .expect_fetch_and_save_nns_proposals()
            .once()
            .return_const(Ok(SyncProposalsResponse {
                synced_proposals_count,
                completed_proposals_count,
            }));

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        controller.sync_proposals_job().await;
    }

    #[rstest]
    async fn sync_proposals_failure() {
        let access_control_service_mock = MockAccessControlService::new();

        let mut log_service_mock = MockLogService::new();
        log_service_mock
            .expect_log_info()
            .once()
            .with(
                eq("Syncing proposals".to_string()),
                eq(Some("sync_proposals".to_string())),
            )
            .return_const(Ok(()));
        log_service_mock
            .expect_log_error()
            .once()
            .with(
                eq("Error syncing proposals (500: Failed to do something)".to_string()),
                eq(Some("sync_proposals".to_string())),
            )
            .return_const(Ok(()));

        let mut proposal_service_mock = MockProposalService::new();
        proposal_service_mock
            .expect_fetch_and_save_nns_proposals()
            .once()
            .return_const(Err(ApiError::internal("Failed to do something")));

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        controller.sync_proposals_job().await;
    }

    #[rstest]
    fn complete_pending_proposals_success() {
        let access_control_service_mock = MockAccessControlService::new();
        let completed_proposals_count = 2;

        let mut log_service_mock = MockLogService::new();
        log_service_mock
            .expect_log_info()
            .once()
            .with(
                eq("Closing proposals".to_string()),
                eq(Some("complete_pending_proposals".to_string())),
            )
            .return_const(Ok(()));
        log_service_mock
            .expect_log_info()
            .once()
            .with(
                eq(format!(
                    "Successfully closed {completed_proposals_count} completed proposals"
                )),
                eq(Some("complete_pending_proposals".to_string())),
            )
            .return_const(Ok(()));

        let mut proposal_service_mock = MockProposalService::new();
        proposal_service_mock
            .expect_complete_pending_proposals()
            .once()
            .return_const(Ok(completed_proposals_count));

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        controller.complete_pending_proposals_job();
    }

    #[rstest]
    fn complete_pending_proposals_failure() {
        let access_control_service_mock = MockAccessControlService::new();

        let mut log_service_mock = MockLogService::new();
        log_service_mock
            .expect_log_info()
            .once()
            .with(
                eq("Closing proposals".to_string()),
                eq(Some("complete_pending_proposals".to_string())),
            )
            .return_const(Ok(()));
        log_service_mock
            .expect_log_error()
            .once()
            .with(
                eq("Error closing completed proposals (500: Failed to do something)".to_string()),
                eq(Some("complete_pending_proposals".to_string())),
            )
            .return_const(Ok(()));

        let mut proposal_service_mock = MockProposalService::new();
        proposal_service_mock
            .expect_complete_pending_proposals()
            .once()
            .return_const(Err(ApiError::internal("Failed to do something")));

        let controller = ProposalController::new(
            access_control_service_mock,
            log_service_mock,
            proposal_service_mock,
        );

        controller.complete_pending_proposals_job();
    }
}
