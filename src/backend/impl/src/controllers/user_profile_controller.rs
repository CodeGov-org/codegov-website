use crate::{
    repositories::UserProfileRepositoryImpl,
    services::{
        AccessControlService, AccessControlServiceImpl, UserProfileService, UserProfileServiceImpl,
    },
};
use backend_api::{
    ApiError, ApiResult, CreateMyUserProfileResponse, GetMyUserProfileHistoryResponse,
    GetMyUserProfileResponse,
};
use candid::Principal;
use ic_cdk::*;

#[query]
fn get_my_user_profile() -> ApiResult<GetMyUserProfileResponse> {
    let calling_principal = caller();

    UserProfileController::default()
        .get_my_user_profile(calling_principal)
        .into()
}

#[query]
fn get_my_user_profile_history() -> ApiResult<GetMyUserProfileHistoryResponse> {
    let calling_principal = caller();

    UserProfileController::default()
        .get_my_user_profile_history(calling_principal)
        .into()
}

#[update]
async fn create_my_user_profile() -> ApiResult<CreateMyUserProfileResponse> {
    let calling_principal = caller();

    UserProfileController::default()
        .create_my_user_profile(calling_principal)
        .await
        .into()
}

struct UserProfileController<A: AccessControlService, U: UserProfileService> {
    access_control_service: A,
    user_profile_service: U,
}

impl Default
    for UserProfileController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        UserProfileServiceImpl<UserProfileRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(
            AccessControlServiceImpl::default(),
            UserProfileServiceImpl::default(),
        )
    }
}

impl<A: AccessControlService, U: UserProfileService> UserProfileController<A, U> {
    fn new(access_control_service: A, user_profile_service: U) -> Self {
        Self {
            access_control_service,
            user_profile_service,
        }
    }

    fn get_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileResponse, ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;

        let profile = self
            .user_profile_service
            .get_my_user_profile(calling_principal)?;

        Ok(profile)
    }

    fn get_my_user_profile_history(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileHistoryResponse, ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;

        let profile_history = self
            .user_profile_service
            .get_my_user_profile_history(calling_principal)?;

        Ok(profile_history)
    }

    async fn create_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<CreateMyUserProfileResponse, ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;

        let profile = self
            .user_profile_service
            .create_my_user_profile(calling_principal)
            .await?;

        Ok(profile)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        mappings::{map_get_my_user_profile_history_response, map_get_my_user_profile_response},
        services::{MockAccessControlService, MockUserProfileService},
    };
    use backend_api::UserConfig;
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    fn get_my_user_profile() {
        let calling_principal = fixtures::principal();
        let profile =
            map_get_my_user_profile_response(fixtures::user_id(), fixtures::admin_user_profile());

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut user_profile_service_mock = MockUserProfileService::new();
        let returned_profile = profile.clone();
        user_profile_service_mock
            .expect_get_my_user_profile()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(returned_profile));

        let controller =
            UserProfileController::new(access_control_service_mock, user_profile_service_mock);

        let res = controller.get_my_user_profile(calling_principal).unwrap();

        assert_eq!(res, profile);
    }

    #[rstest]
    fn get_my_user_profile_anonymous_principal() {
        let calling_principal = Principal::anonymous();

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(ApiError::unauthenticated()));

        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_get_my_user_profile().never();

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let res = controller
            .get_my_user_profile(calling_principal)
            .unwrap_err();

        assert_eq!(res, ApiError::unauthenticated());
    }

    #[rstest]
    fn get_my_user_profile_no_profile() {
        let calling_principal = fixtures::principal();
        let error = ApiError::not_found("User profile not found");

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockUserProfileService::new();
        let returned_error = error.clone();
        service_mock
            .expect_get_my_user_profile()
            .once()
            .with(eq(calling_principal))
            .return_once(move |_| Err(returned_error));

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let res = controller
            .get_my_user_profile(calling_principal)
            .unwrap_err();

        assert_eq!(res, error);
    }

    #[rstest]
    fn get_my_user_profile_history() {
        let calling_principal = fixtures::principal();
        let profile_history =
            map_get_my_user_profile_history_response(fixtures::user_profile_history());

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockUserProfileService::new();
        let returned_profile_history = profile_history.clone();
        service_mock
            .expect_get_my_user_profile_history()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(returned_profile_history));

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let res = controller
            .get_my_user_profile_history(calling_principal)
            .unwrap();

        assert_eq!(res, profile_history);
    }

    #[rstest]
    fn get_my_user_profile_history_anonymous_user() {
        let calling_principal = Principal::anonymous();

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(ApiError::unauthenticated()));

        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_get_my_user_profile_history().never();

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let res = controller
            .get_my_user_profile_history(calling_principal)
            .unwrap_err();

        assert_eq!(res, ApiError::unauthenticated());
    }

    #[rstest]
    fn get_my_user_profile_history_no_history() {
        let calling_principal = Principal::anonymous();

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(ApiError::unauthenticated()));

        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_get_my_user_profile_history().never();

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let res = controller
            .get_my_user_profile_history(calling_principal)
            .unwrap_err();

        assert_eq!(res, ApiError::unauthenticated());
    }

    #[rstest]
    async fn create_my_user_profile() {
        let calling_principal = fixtures::principal();
        let profile = CreateMyUserProfileResponse {
            id: "id".to_string(),
            username: "username".to_string(),
            config: UserConfig::Anonymous,
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockUserProfileService::new();
        let returned_profile = profile.clone();
        service_mock
            .expect_create_my_user_profile()
            .once()
            .with(eq(calling_principal))
            .return_once(move |_| Ok(returned_profile));

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let res = controller
            .create_my_user_profile(calling_principal)
            .await
            .unwrap();

        assert_eq!(res, profile);
    }

    #[rstest]
    async fn create_my_user_profile_anonymous_principal() {
        let calling_principal = Principal::anonymous();

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(ApiError::unauthenticated()));

        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_create_my_user_profile().never();

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let res = controller
            .create_my_user_profile(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(res, ApiError::unauthenticated());
    }
}
