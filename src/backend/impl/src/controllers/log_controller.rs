use crate::{
    repositories::{LogRepositoryImpl, UserProfileRepositoryImpl},
    services::{AccessControlService, AccessControlServiceImpl, LogService, LogServiceImpl},
};
use backend_api::{ApiError, ApiResult, ListLogsResponse, LogsFilterRequest};
use candid::Principal;
use ic_cdk::*;

#[query]
fn list_logs(request: LogsFilterRequest) -> ApiResult<ListLogsResponse> {
    let calling_principal = caller();

    LogController::default()
        .list_logs(calling_principal, request)
        .into()
}

struct LogController<A: AccessControlService, L: LogService> {
    access_control_service: A,
    log_service: L,
}

impl Default
    for LogController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        LogServiceImpl<LogRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(
            AccessControlServiceImpl::default(),
            LogServiceImpl::default(),
        )
    }
}

impl<A: AccessControlService, L: LogService> LogController<A, L> {
    fn new(access_control_service: A, log_service: L) -> Self {
        Self {
            access_control_service,
            log_service,
        }
    }

    fn list_logs(
        &self,
        calling_principal: Principal,
        request: LogsFilterRequest,
    ) -> Result<ListLogsResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.log_service.list_logs(request)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        mappings::map_list_logs_response,
        services::{MockAccessControlService, MockLogService},
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    #[case::anonymous_principal(Principal::anonymous())]
    #[case::non_admin_principal(fixtures::principal_a())]
    fn list_logs_unauthorized(#[case] calling_principal: Principal) {
        let request = LogsFilterRequest {
            before_timestamp_ms: None,
            after_timestamp_ms: None,
            level: None,
            context_contains_any: None,
            message_contains_any: None,
        };

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

        let mut service_mock = MockLogService::new();
        service_mock.expect_list_logs().never();

        let controller = LogController::new(access_control_service_mock, service_mock);

        let result = controller
            .list_logs(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, error);
    }

    #[rstest]
    fn list_logs() {
        let calling_principal = fixtures::principal_a();
        let request = LogsFilterRequest {
            before_timestamp_ms: None,
            after_timestamp_ms: None,
            level: None,
            context_contains_any: None,
            message_contains_any: None,
        };

        let logs = map_list_logs_response(vec![fixtures::log_entry_info()]);

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_admin()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockLogService::new();
        service_mock
            .expect_list_logs()
            .once()
            .with(eq(request.clone()))
            .return_const(Ok(logs.clone()));

        let controller = LogController::new(access_control_service_mock, service_mock);

        let result = controller.list_logs(calling_principal, request).unwrap();

        assert_eq!(result, logs);
    }
}
