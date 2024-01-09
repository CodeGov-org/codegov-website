use super::{
    init_user_profile_principal_index, init_user_profiles, UserId, UserProfile, UserProfileMemory,
    UserProfilePrincipalIndexMemory,
};
use backend_api::ApiError;
use candid::Principal;
use std::cell::RefCell;

#[cfg_attr(test, mockall::automock)]
pub trait UserProfileRepository {
    fn get_user_profile_by_principal(&self, principal: &Principal)
        -> Option<(UserId, UserProfile)>;

    async fn create_user_profile(
        &self,
        principal: Principal,
        user_profile: UserProfile,
    ) -> Result<UserId, ApiError>;
}

pub struct UserProfileRepositoryImpl {}

impl Default for UserProfileRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl UserProfileRepository for UserProfileRepositoryImpl {
    fn get_user_profile_by_principal(
        &self,
        principal: &Principal,
    ) -> Option<(UserId, UserProfile)> {
        self.get_user_id_by_principal(principal)
            .and_then(|user_id| {
                self.get_user_profile_by_user_id(&user_id)
                    .map(|user_profile| (user_id, user_profile))
            })
    }

    async fn create_user_profile(
        &self,
        principal: Principal,
        user_profile: UserProfile,
    ) -> Result<UserId, ApiError> {
        let user_id = UserId::new().await?;

        STATE.with_borrow_mut(|s| {
            s.profiles.insert(user_id, user_profile);
            s.principal_index.insert(principal, user_id);
        });

        Ok(user_id)
    }
}

impl UserProfileRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }

    fn get_user_id_by_principal(&self, principal: &Principal) -> Option<UserId> {
        STATE.with_borrow(|s| s.principal_index.get(principal))
    }

    fn get_user_profile_by_user_id(&self, user_id: &UserId) -> Option<UserProfile> {
        STATE.with_borrow(|s| s.profiles.get(user_id))
    }
}

struct UserProfileState {
    profiles: UserProfileMemory,
    principal_index: UserProfilePrincipalIndexMemory,
}

impl Default for UserProfileState {
    fn default() -> Self {
        Self {
            profiles: init_user_profiles(),
            principal_index: init_user_profile_principal_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<UserProfileState> = RefCell::new(UserProfileState::default());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case::anonymous_user(fixtures::anonymous_user_profile())]
    #[case::reviewer(fixtures::reviewer_user_profile())]
    #[case::admin(fixtures::admin_user_profile())]
    async fn create_and_get_user_profile_by_principal(#[case] profile: UserProfile) {
        STATE.set(UserProfileState::default());
        let principal = fixtures::principal();

        let repository = UserProfileRepositoryImpl::default();
        let user_id = repository
            .create_user_profile(principal, profile.clone())
            .await
            .unwrap();

        let result = repository.get_user_profile_by_principal(&principal);

        assert_eq!(result, Some((user_id, profile)));
    }
}
