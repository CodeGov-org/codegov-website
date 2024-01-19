use crate::{
    mappings::{
        map_create_my_user_profile_response, map_get_my_user_profile_history_response,
        map_get_my_user_profile_response,
    },
    repositories::{UserProfile, UserProfileRepository, UserProfileRepositoryImpl},
};
use backend_api::{
    ApiError, CreateMyUserProfileResponse, GetMyUserProfileHistoryResponse,
    GetMyUserProfileResponse,
};
use candid::Principal;

#[cfg_attr(test, mockall::automock)]
pub trait UserProfileService {
    fn get_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileResponse, ApiError>;

    fn get_my_user_profile_history(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileHistoryResponse, ApiError>;

    async fn create_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<CreateMyUserProfileResponse, ApiError>;
}

pub struct UserProfileServiceImpl<T: UserProfileRepository> {
    user_profile_repository: T,
}

impl Default for UserProfileServiceImpl<UserProfileRepositoryImpl> {
    fn default() -> Self {
        Self::new(UserProfileRepositoryImpl::default())
    }
}

impl<T: UserProfileRepository> UserProfileService for UserProfileServiceImpl<T> {
    fn get_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileResponse, ApiError> {
        let (id, profile) = self
            .user_profile_repository
            .get_user_profile_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile with principal {} not found",
                    &calling_principal.to_text()
                ))
            })?;

        Ok(map_get_my_user_profile_response(id, profile))
    }

    fn get_my_user_profile_history(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileHistoryResponse, ApiError> {
        let history = self
            .user_profile_repository
            .get_user_profile_history_by_principal(&calling_principal)?
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile history for principal {} not found",
                    &calling_principal.to_text()
                ))
            })?;

        Ok(map_get_my_user_profile_history_response(history))
    }

    async fn create_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<CreateMyUserProfileResponse, ApiError> {
        let profile = UserProfile::new_anonymous();
        let id = self
            .user_profile_repository
            .create_user_profile(calling_principal, profile.clone())
            .await?;

        Ok(map_create_my_user_profile_response(id, profile))
    }
}

impl<T: UserProfileRepository> UserProfileServiceImpl<T> {
    fn new(user_profile_repository: T) -> Self {
        Self {
            user_profile_repository,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{fixtures, repositories::MockUserProfileRepository};
    use backend_api::{HistoryAction, HistoryEntry, UserProfileHistoryEntry};
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    async fn get_my_user_profile() {
        let calling_principal = fixtures::principal();
        let id = fixtures::user_id();
        let profile = fixtures::admin_user_profile();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some((fixtures::user_id(), profile.clone())));

        let service = UserProfileServiceImpl::new(repository_mock);

        let res = service.get_my_user_profile(calling_principal).unwrap();

        assert_eq!(
            res,
            GetMyUserProfileResponse {
                id: id.to_string(),
                username: profile.username,
                config: profile.config.into(),
            }
        )
    }

    #[rstest]
    async fn get_my_user_profile_no_profile() {
        let calling_principal = fixtures::principal();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);

        let service = UserProfileServiceImpl::new(repository_mock);

        let res = service.get_my_user_profile(calling_principal).unwrap_err();

        assert_eq!(
            res,
            ApiError::not_found(&format!(
                "User profile with principal {} not found",
                &calling_principal.to_text()
            ))
        );
    }

    #[rstest]
    fn get_my_user_profile_history() {
        let calling_principal = fixtures::principal();
        let history = fixtures::user_profile_history();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_history_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(Some(history.clone())));

        let service = UserProfileServiceImpl::new(repository_mock);

        let res = service
            .get_my_user_profile_history(calling_principal)
            .unwrap();

        assert_eq!(
            res,
            GetMyUserProfileHistoryResponse {
                history: vec![HistoryEntry {
                    action: HistoryAction::Create,
                    date_time: history[0].clone().date_time.to_string(),
                    user: history[0].clone().principal,
                    data: UserProfileHistoryEntry {
                        username: history[0].clone().data.username,
                        config: history[0].clone().data.config.into(),
                    }
                }]
            }
        )
    }

    #[rstest]
    fn get_my_user_profile_history_no_history() {
        let calling_principal = fixtures::principal();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_history_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(None));

        let service = UserProfileServiceImpl::new(repository_mock);

        let res = service
            .get_my_user_profile_history(calling_principal)
            .unwrap_err();

        assert_eq!(
            res,
            ApiError::not_found(&format!(
                "User profile history for principal {} not found",
                &calling_principal.to_text()
            ))
        )
    }

    #[rstest]
    async fn create_my_user_profile() {
        let calling_principal = fixtures::principal();
        let id = fixtures::user_id();
        let profile = UserProfile::new_anonymous();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_create_user_profile()
            .once()
            .with(eq(calling_principal), eq(profile.clone()))
            .return_const(Ok(id));

        let service = UserProfileServiceImpl::new(repository_mock);

        let res = service
            .create_my_user_profile(calling_principal)
            .await
            .unwrap();

        assert_eq!(
            res,
            CreateMyUserProfileResponse {
                id: id.to_string(),
                username: profile.username,
                config: profile.config.into(),
            }
        )
    }
}
