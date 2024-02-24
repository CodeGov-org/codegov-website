use backend_api::ApiError;
use candid::Principal;

use crate::repositories::{UserProfile, UserProfileRepository, UserProfileRepositoryImpl};

#[cfg_attr(test, mockall::automock)]
pub trait InitService {
    async fn init(&self, calling_principal: Principal) -> Result<(), ApiError>;
}

pub struct InitServiceImpl<T: UserProfileRepository> {
    user_profile_repository: T,
}

impl Default for InitServiceImpl<UserProfileRepositoryImpl> {
    fn default() -> Self {
        Self::new(UserProfileRepositoryImpl::default())
    }
}

impl<T: UserProfileRepository> InitService for InitServiceImpl<T> {
    async fn init(&self, calling_principal: Principal) -> Result<(), ApiError> {
        if self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .is_some()
        {
            return Ok(());
        }

        let profile = UserProfile::new_admin();

        self.user_profile_repository
            .create_user_profile(calling_principal, profile.clone())
            .await?;

        Ok(())
    }
}

impl<T: UserProfileRepository> InitServiceImpl<T> {
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
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    async fn init_with_new_principal() {
        let calling_principal = fixtures::principal();
        let id = fixtures::user_id();
        let profile = UserProfile::new_admin();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        repository_mock
            .expect_create_user_profile()
            .once()
            .with(eq(calling_principal), eq(profile.clone()))
            .return_const(Ok(id));

        let service = InitServiceImpl::new(repository_mock);

        service.init(calling_principal).await.unwrap();
    }

    #[rstest]
    async fn init_with_existing_principal() {
        let calling_principal = fixtures::principal();
        let id = fixtures::user_id();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(id));
        repository_mock.expect_create_user_profile().never();

        let service = InitServiceImpl::new(repository_mock);

        service.init(calling_principal).await.unwrap();
    }
}
