use crate::{
    repositories::UserProfileRepositoryImpl,
    services::{UserProfileService, UserProfileServiceImpl},
    system_api::assert_principal_not_anonymous,
};
use backend_api::{ApiError, ApiResult, CreateMyUserProfileResponse, GetMyUserProfileResponse};
use candid::Principal;
use ic_cdk::*;

#[query]
async fn get_my_user_profile() -> ApiResult<GetMyUserProfileResponse> {
    let calling_principal = caller();

    UserProfileController::default()
        .get_my_user_profile(calling_principal)
        .await
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

struct UserProfileController<T: UserProfileService> {
    user_profile_service: T,
}

impl Default for UserProfileController<UserProfileServiceImpl<UserProfileRepositoryImpl>> {
    fn default() -> Self {
        Self::new(UserProfileServiceImpl::default())
    }
}

impl<T: UserProfileService> UserProfileController<T> {
    fn new(user_profile_service: T) -> Self {
        Self {
            user_profile_service,
        }
    }

    async fn get_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileResponse, ApiError> {
        assert_principal_not_anonymous(&calling_principal)?;

        let profile = self
            .user_profile_service
            .get_my_user_profile(calling_principal)
            .await?;

        Ok(profile)
    }

    async fn create_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<CreateMyUserProfileResponse, ApiError> {
        assert_principal_not_anonymous(&calling_principal)?;

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
    use crate::{fixtures, services::MockUserProfileService};
    use backend_api::UserConfig;
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    async fn get_my_user_profile() {
        let calling_principal = fixtures::principal();
        let profile = GetMyUserProfileResponse {
            id: "id".to_string(),
            username: "username".to_string(),
            config: UserConfig::Anonymous,
        };

        let mut service_mock = MockUserProfileService::new();
        let returned_profile = profile.clone();
        service_mock
            .expect_get_my_user_profile()
            .once()
            .with(eq(calling_principal))
            .return_once(move |_| Ok(returned_profile));

        let controller = UserProfileController::new(service_mock);

        let res = controller
            .get_my_user_profile(calling_principal)
            .await
            .unwrap();

        assert_eq!(res, profile);
    }

    #[rstest]
    async fn get_my_user_profile_anonymous_principal() {
        let calling_principal = Principal::anonymous();
        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_get_my_user_profile().never();

        let controller = UserProfileController::new(service_mock);

        let res = controller
            .get_my_user_profile(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(res, ApiError::unauthenticated());
    }

    #[rstest]
    async fn get_my_user_profile_no_profile() {
        let calling_principal = fixtures::principal();
        let error = ApiError::not_found("User profile not found");

        let mut service_mock = MockUserProfileService::new();
        let returned_error = error.clone();
        service_mock
            .expect_get_my_user_profile()
            .once()
            .with(eq(calling_principal))
            .return_once(move |_| Err(returned_error));

        let controller = UserProfileController::new(service_mock);

        let res = controller
            .get_my_user_profile(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(res, error);
    }

    #[rstest]
    async fn create_my_user_profile() {
        let calling_principal = fixtures::principal();
        let profile = CreateMyUserProfileResponse {
            id: "id".to_string(),
            username: "username".to_string(),
            config: UserConfig::Anonymous,
        };

        let mut service_mock = MockUserProfileService::new();
        let returned_profile = profile.clone();
        service_mock
            .expect_create_my_user_profile()
            .once()
            .with(eq(calling_principal))
            .return_once(move |_| Ok(returned_profile));

        let controller = UserProfileController::new(service_mock);

        let res = controller
            .create_my_user_profile(calling_principal)
            .await
            .unwrap();

        assert_eq!(res, profile);
    }

    #[rstest]
    async fn create_my_user_profile_anonymous_principal() {
        let calling_principal = Principal::anonymous();
        let mut service_mock = MockUserProfileService::new();
        service_mock.expect_create_my_user_profile().never();

        let controller = UserProfileController::new(service_mock);

        let res = controller
            .create_my_user_profile(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(res, ApiError::unauthenticated());
    }
}
