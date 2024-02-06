use super::{
    init_user_profile_history_id, init_user_profile_principal_index, init_user_profiles,
    memories::{init_user_profiles_history, UserProfileHistoryMemory},
    UserId, UserProfile, UserProfileHistoryEntry, UserProfileHistoryIdMemory,
    UserProfileHistoryKey, UserProfileHistoryRange, UserProfileMemory,
    UserProfilePrincipalIndexMemory,
};
use backend_api::ApiError;
use candid::Principal;
use std::cell::RefCell;

#[cfg_attr(test, mockall::automock)]
pub trait UserProfileRepository {
    fn get_user_profile_by_principal(&self, principal: &Principal)
        -> Option<(UserId, UserProfile)>;

    fn get_user_profile_by_user_id(&self, user_id: &UserId) -> Option<UserProfile>;

    fn get_user_profile_history_by_principal(
        &self,
        principal: &Principal,
    ) -> Result<Option<Vec<UserProfileHistoryEntry>>, ApiError>;

    fn get_user_id_by_principal(&self, principal: &Principal) -> Option<UserId>;

    async fn create_user_profile(
        &self,
        calling_principal: Principal,
        user_profile: UserProfile,
    ) -> Result<UserId, ApiError>;

    fn update_user_profile(
        &self,
        calling_principal: Principal,
        user_id: UserId,
        user_profile: UserProfile,
    ) -> Result<(), ApiError>;
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

    fn get_user_profile_by_user_id(&self, user_id: &UserId) -> Option<UserProfile> {
        STATE.with_borrow(|s| s.profiles.get(user_id))
    }

    fn get_user_profile_history_by_principal(
        &self,
        principal: &Principal,
    ) -> Result<Option<Vec<UserProfileHistoryEntry>>, ApiError> {
        self.get_user_id_by_principal(principal)
            .map(|user_id| self.get_user_profile_history_by_user_id(user_id))
            .transpose()
    }

    fn get_user_id_by_principal(&self, principal: &Principal) -> Option<UserId> {
        STATE.with_borrow(|s| s.principal_index.get(principal))
    }

    async fn create_user_profile(
        &self,
        calling_principal: Principal,
        user_profile: UserProfile,
    ) -> Result<UserId, ApiError> {
        let user_id = UserId::new().await?;
        let history_entry_id = Self::get_next_history_id()?;

        STATE.with_borrow_mut(|s| {
            s.profiles.insert(user_id, user_profile.clone());
            s.principal_index.insert(calling_principal, user_id);

            let history_entry =
                UserProfileHistoryEntry::create_action(calling_principal, user_profile)?;
            s.profiles_history.insert(
                UserProfileHistoryKey::new(
                    user_id,
                    history_entry.date_time.clone(),
                    history_entry_id,
                )?,
                history_entry,
            );

            Ok(())
        })?;

        Ok(user_id)
    }

    fn update_user_profile(
        &self,
        calling_principal: Principal,
        user_id: UserId,
        user_profile: UserProfile,
    ) -> Result<(), ApiError> {
        self.get_user_profile_by_user_id(&user_id).ok_or_else(|| {
            ApiError::not_found(&format!(
                "User profile for user with id {} not found",
                user_id.to_string()
            ))
        })?;

        let history_entry_id = Self::get_next_history_id()?;

        STATE.with_borrow_mut(|s| {
            s.profiles.insert(user_id, user_profile.clone());

            let history_entry =
                UserProfileHistoryEntry::update_action(calling_principal, user_profile)?;
            s.profiles_history.insert(
                UserProfileHistoryKey::new(
                    user_id,
                    history_entry.date_time.clone(),
                    history_entry_id,
                )?,
                history_entry,
            );

            Ok(())
        })
    }
}

impl UserProfileRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }

    fn get_user_profile_history_by_user_id(
        &self,
        user_id: UserId,
    ) -> Result<Vec<UserProfileHistoryEntry>, ApiError> {
        STATE.with_borrow(|s| {
            Ok(s.profiles_history
                .range(UserProfileHistoryRange::new(user_id)?)
                .map(|(_, entry)| entry)
                .collect())
        })
    }

    fn get_next_history_id() -> Result<u128, ApiError> {
        STATE.with_borrow_mut(|s| {
            // This id is used to ensure that parallel writes on profile history for the same
            // user will not overwrite each other. To overwrite each other with this id, the same
            // user would have to update their profile more than u128::MAX times within the same round.
            let next_id = s.profiles_history_id.get().wrapping_add(1);

            s.profiles_history_id.set(next_id).map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to set user profile history id. Next id: {}",
                    next_id
                ))
            })?;

            Ok(next_id)
        })
    }
}

struct UserProfileState {
    profiles: UserProfileMemory,
    principal_index: UserProfilePrincipalIndexMemory,
    profiles_history: UserProfileHistoryMemory,
    profiles_history_id: UserProfileHistoryIdMemory,
}

impl Default for UserProfileState {
    fn default() -> Self {
        Self {
            profiles: init_user_profiles(),
            principal_index: init_user_profile_principal_index(),
            profiles_history: init_user_profiles_history(),
            profiles_history_id: init_user_profile_history_id(),
        }
    }
}

thread_local! {
    static STATE: RefCell<UserProfileState> = RefCell::new(UserProfileState::default());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        repositories::{DateTime, HistoryAction},
        system_api::get_date_time,
    };
    use rstest::*;

    #[rstest]
    #[case::anonymous_user(fixtures::anonymous_user_profile())]
    #[case::reviewer(fixtures::reviewer_user_profile())]
    #[case::admin(fixtures::admin_user_profile())]
    async fn create_and_get_user_profile_by_principal(#[case] profile: UserProfile) {
        STATE.set(UserProfileState::default());
        let principal = fixtures::principal();
        let date_time = get_date_time().unwrap();

        let repository = UserProfileRepositoryImpl::default();
        let user_id = repository
            .create_user_profile(principal, profile.clone())
            .await
            .unwrap();

        let result = repository.get_user_profile_by_principal(&principal);
        let history_result = repository
            .get_user_profile_history_by_principal(&principal)
            .unwrap()
            .unwrap();

        assert_eq!(result, Some((user_id, profile.clone())));
        assert_eq!(history_result.len(), 1);
        assert_eq!(
            history_result[0],
            UserProfileHistoryEntry {
                action: HistoryAction::Create,
                principal,
                date_time: DateTime::new(date_time).unwrap(),
                data: profile,
            }
        );
    }

    #[rstest]
    #[case::anonymous_user(fixtures::anonymous_user_profile(), updated_anonymous_user_profile())]
    #[case::anonymous_user(fixtures::reviewer_user_profile(), updated_reviewer_user_profile())]
    #[case::anonymous_user(fixtures::admin_user_profile(), updated_admin_user_profile())]
    async fn update_and_get_user_profile_by_user_id(
        #[case] original_profile: UserProfile,
        #[case] updated_profile: UserProfile,
    ) {
        STATE.set(UserProfileState::default());
        let principal = fixtures::principal();
        let date_time = get_date_time().unwrap();

        let repository = UserProfileRepositoryImpl::default();
        let user_id = repository
            .create_user_profile(principal, original_profile.clone())
            .await
            .unwrap();

        repository
            .update_user_profile(principal, user_id, updated_profile.clone())
            .unwrap();

        let result = repository.get_user_profile_by_user_id(&user_id);
        let history_result = repository
            .get_user_profile_history_by_principal(&principal)
            .unwrap()
            .unwrap();

        assert_eq!(result, Some(updated_profile.clone()));
        assert_eq!(history_result.len(), 2);
        assert_eq!(
            history_result[0],
            UserProfileHistoryEntry {
                action: HistoryAction::Create,
                principal,
                date_time: DateTime::new(date_time).unwrap(),
                data: original_profile,
            }
        );
        assert_eq!(
            history_result[1],
            UserProfileHistoryEntry {
                action: HistoryAction::Update,
                principal,
                date_time: DateTime::new(date_time).unwrap(),
                data: updated_profile,
            }
        );
    }

    #[fixture]
    fn updated_anonymous_user_profile() -> UserProfile {
        UserProfile {
            username: "AlpineAdventurer2024".to_string(),
            ..fixtures::anonymous_user_profile()
        }
    }

    #[fixture]
    fn updated_reviewer_user_profile() -> UserProfile {
        UserProfile {
            username: "ZurichExplorer2024".to_string(),
            ..fixtures::reviewer_user_profile()
        }
    }

    #[fixture]
    fn updated_admin_user_profile() -> UserProfile {
        UserProfile {
            username: "AlpineExplorer2024".to_string(),
            ..fixtures::admin_user_profile()
        }
    }
}
