use crate::{
    repositories::UserProfileRepositoryImpl,
    services::{
        AccessControlService, AccessControlServiceImpl, UserProfileService, UserProfileServiceImpl,
    },
};
use backend_api::{
    ApiError, ApiResult, CreateMyUserProfileResponse, GetMyUserProfileHistoryResponse,
    GetMyUserProfileResponse, ListReviewerProfilesResponse, UpdateMyUserProfileRequest,
    UpdateUserProfileRequest,
};
use candid::Principal;
use ic_cdk::*;

#[query]
fn list_reviewer_profiles() -> ApiResult<ListReviewerProfilesResponse> {
    UserProfileController::default()
        .list_reviewer_profiles()
        .into()
}

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

#[update]
fn update_my_user_profile(request: UpdateMyUserProfileRequest) -> ApiResult<()> {
    let calling_principal = caller();

    UserProfileController::default()
        .update_my_user_profile(calling_principal, request)
        .into()
}

#[update]
async fn update_user_profile(request: UpdateUserProfileRequest) -> ApiResult<()> {
    let calling_principal = caller();

    UserProfileController::default()
        .update_user_profile(calling_principal, request)
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

    fn list_reviewer_profiles(&self) -> Result<ListReviewerProfilesResponse, ApiError> {
        let profiles = self.user_profile_service.list_reviewer_profiles()?;

        Ok(profiles)
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

    fn update_my_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateMyUserProfileRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;

        self.user_profile_service
            .update_my_user_profile(calling_principal, request)?;

        Ok(())
    }

    fn update_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateUserProfileRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.user_profile_service
            .update_user_profile(calling_principal, request)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        mappings::{
            map_get_my_user_profile_history_response, map_get_my_user_profile_response,
            map_list_reviewer_profiles_response,
        },
        services::{MockAccessControlService, MockUserProfileService},
    };
    use backend_api::UserConfig;
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    fn list_reviewer_profiles() {
        let profiles = map_list_reviewer_profiles_response(vec![(
            fixtures::user_id(),
            fixtures::reviewer_user_profile(),
        )]);

        let mut service_mock = MockUserProfileService::new();
        service_mock
            .expect_list_reviewer_profiles()
            .once()
            .return_const(Ok(profiles.clone()));

        let controller = UserProfileController::new(MockAccessControlService::new(), service_mock);

        let result = controller.list_reviewer_profiles().unwrap();

        assert_eq!(result, profiles);
    }

    #[rstest]
    fn get_my_user_profile() {
        let calling_principal = fixtures::principal_a();
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

        let result = controller.get_my_user_profile(calling_principal).unwrap();

        assert_eq!(result, profile);
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

        let result = controller
            .get_my_user_profile(calling_principal)
            .unwrap_err();

        assert_eq!(result, ApiError::unauthenticated());
    }

    #[rstest]
    fn get_my_user_profile_no_profile() {
        let calling_principal = fixtures::principal_a();
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
            .return_const(Err(returned_error));

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let result = controller
            .get_my_user_profile(calling_principal)
            .unwrap_err();

        assert_eq!(result, error);
    }

    #[rstest]
    fn get_my_user_profile_history() {
        let calling_principal = fixtures::principal_a();
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

        let result = controller
            .get_my_user_profile_history(calling_principal)
            .unwrap();

        assert_eq!(result, profile_history);
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

        let result = controller
            .get_my_user_profile_history(calling_principal)
            .unwrap_err();

        assert_eq!(result, ApiError::unauthenticated());
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

        let result = controller
            .get_my_user_profile_history(calling_principal)
            .unwrap_err();

        assert_eq!(result, ApiError::unauthenticated());
    }

    #[rstest]
    async fn create_my_user_profile() {
        let calling_principal = fixtures::principal_a();
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
            .return_const(Ok(returned_profile));

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let result = controller
            .create_my_user_profile(calling_principal)
            .await
            .unwrap();

        assert_eq!(result, profile);
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

        let result = controller
            .create_my_user_profile(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(result, ApiError::unauthenticated());
    }

    #[rstest]
    fn update_user_profile() {
        let calling_principal = fixtures::principal_a();
        let user_id = fixtures::user_id();
        let request = UpdateUserProfileRequest {
            user_id: user_id.to_string(),
            username: Some("username".to_string()),
            config: None,
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));
        access_control_service_mock
            .expect_assert_principal_is_admin()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockUserProfileService::new();
        service_mock
            .expect_update_user_profile()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(()));

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        controller
            .update_user_profile(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    fn update_my_user_profile() {
        let calling_principal = fixtures::principal_a();
        let request = UpdateMyUserProfileRequest {
            username: Some("username".to_string()),
            config: None,
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockUserProfileService::new();
        service_mock
            .expect_update_my_user_profile()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(()));

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        controller
            .update_my_user_profile(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    fn update_my_user_profile_anonymous_principal() {
        let calling_principal = Principal::anonymous();
        let request = UpdateMyUserProfileRequest {
            username: Some("username".to_string()),
            config: None,
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(ApiError::unauthenticated()));

        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_update_my_user_profile().never();

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let result = controller
            .update_my_user_profile(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, ApiError::unauthenticated());
    }

    #[rstest]
    fn update_user_profile_anonymous_principal() {
        let calling_principal = Principal::anonymous();
        let user_id = fixtures::user_id();
        let request = UpdateUserProfileRequest {
            user_id: user_id.to_string(),
            username: Some("username".to_string()),
            config: None,
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(ApiError::unauthenticated()));
        access_control_service_mock
            .expect_assert_principal_is_admin()
            .never();

        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_update_user_profile().never();

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let result = controller
            .update_user_profile(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, ApiError::unauthenticated());
    }

    #[rstest]
    fn update_user_profile_non_admin_principal() {
        let calling_principal = fixtures::principal_a();
        let user_id = fixtures::user_id();
        let request = UpdateUserProfileRequest {
            user_id: user_id.to_string(),
            username: Some("username".to_string()),
            config: None,
        };

        let error = ApiError::permission_denied(&format!(
            "Principal {} must be an admin to call this endpoint",
            &calling_principal.to_text()
        ));

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_not_anonymous()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));
        access_control_service_mock
            .expect_assert_principal_is_admin()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(error.clone()));

        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_update_user_profile().never();

        let controller = UserProfileController::new(access_control_service_mock, service_mock);

        let result = controller
            .update_user_profile(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, error);
    }
}
