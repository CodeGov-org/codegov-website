use crate::repositories::{UserConfig, UserProfileRepository, UserProfileRepositoryImpl};
use backend_api::ApiError;
use candid::Principal;

#[cfg_attr(test, mockall::automock)]
pub trait AccessControlService {
    fn assert_principal_not_anonymous(&self, calling_principal: &Principal)
        -> Result<(), ApiError>;

    async fn assert_principal_is_admin(&self, calling_principal: Principal)
        -> Result<(), ApiError>;
}

pub struct AccessControlServiceImpl<T: UserProfileRepository> {
    user_profile_repository: T,
}

impl Default for AccessControlServiceImpl<UserProfileRepositoryImpl> {
    fn default() -> Self {
        Self::new(UserProfileRepositoryImpl::default())
    }
}

impl<T: UserProfileRepository> AccessControlService for AccessControlServiceImpl<T> {
    fn assert_principal_not_anonymous(
        &self,
        calling_principal: &Principal,
    ) -> Result<(), ApiError> {
        if calling_principal == &Principal::anonymous() {
            return Err(ApiError::unauthenticated());
        }

        Ok(())
    }

    async fn assert_principal_is_admin(
        &self,
        calling_principal: Principal,
    ) -> Result<(), ApiError> {
        let (_id, profile) = self
            .user_profile_repository
            .get_user_profile_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Principal {} must have a profile to call this endpoint",
                    &calling_principal.to_text()
                ))
            })?;

        if !matches!(profile.config, UserConfig::Admin { .. }) {
            return Err(ApiError::permission_denied(&format!(
                "Principal {} must be an admin to call this endpoint",
                &calling_principal.to_text()
            )));
        }

        Ok(())
    }
}

impl<T: UserProfileRepository> AccessControlServiceImpl<T> {
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
    fn assert_principal_not_anonymous() {
        let calling_principal = fixtures::principal();

        let repository_mock = MockUserProfileRepository::new();
        let service = AccessControlServiceImpl::new(repository_mock);

        service
            .assert_principal_not_anonymous(&calling_principal)
            .unwrap();
    }

    #[rstest]
    fn assert_principal_not_anonymous_anonymous_principal() {
        let calling_principal = Principal::anonymous();

        let repository_mock = MockUserProfileRepository::new();
        let service = AccessControlServiceImpl::new(repository_mock);

        let result = service
            .assert_principal_not_anonymous(&calling_principal)
            .unwrap_err();

        assert_eq!(result, ApiError::unauthenticated());
    }

    #[rstest]
    async fn assert_principal_is_admin() {
        let calling_principal = fixtures::principal();
        let id = fixtures::user_id();
        let profile = fixtures::admin_user_profile();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some((id, profile)));

        let service = AccessControlServiceImpl::new(repository_mock);

        service
            .assert_principal_is_admin(calling_principal)
            .await
            .unwrap();
    }

    #[rstest]
    async fn assert_principal_is_admin_no_profile() {
        let calling_principal = fixtures::principal();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);

        let service = AccessControlServiceImpl::new(repository_mock);

        let result = service
            .assert_principal_is_admin(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "Principal {} must have a profile to call this endpoint",
                &calling_principal.to_text()
            ))
        );
    }

    #[rstest]
    async fn assert_principal_anonymous_user() {
        let calling_principal = fixtures::principal();
        let id = fixtures::user_id();
        let profile = fixtures::anonymous_user_profile();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some((id, profile)));

        let service = AccessControlServiceImpl::new(repository_mock);

        let result = service
            .assert_principal_is_admin(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::permission_denied(&format!(
                "Principal {} must be an admin to call this endpoint",
                &calling_principal.to_text()
            ))
        );
    }

    #[rstest]
    async fn assert_principal_reviewer() {
        let calling_principal = fixtures::principal();
        let id = fixtures::user_id();
        let profile = fixtures::reviewer_user_profile();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some((id, profile)));

        let service = AccessControlServiceImpl::new(repository_mock);

        let result = service
            .assert_principal_is_admin(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::permission_denied(&format!(
                "Principal {} must be an admin to call this endpoint",
                &calling_principal.to_text()
            ))
        );
    }
}
