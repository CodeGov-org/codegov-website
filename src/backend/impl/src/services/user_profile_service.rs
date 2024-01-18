use crate::{
    mappings::{
        map_create_my_user_profile_response, map_get_my_user_profile_history_response,
        map_get_my_user_profile_response,
    },
    repositories::{
        UserConfig, UserId, UserProfile, UserProfileRepository, UserProfileRepositoryImpl,
    },
};
use backend_api::{
    ApiError, CreateMyUserProfileResponse, GetMyUserProfileHistoryResponse,
    GetMyUserProfileResponse, UpdateUserProfileRequest,
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

    fn update_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateUserProfileRequest,
    ) -> Result<(), ApiError>;
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

    fn update_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateUserProfileRequest,
    ) -> Result<(), ApiError> {
        let user_id = UserId::try_from(request.user_id.as_str())?;
        let mut current_user_profile = self
            .user_profile_repository
            .get_user_profile_by_user_id(&user_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile for user with id {} not found",
                    user_id.to_string()
                ))
            })?;

        if let Some(username) = request.username {
            current_user_profile.username = username;
        }

        if let Some(config) = request.config {
            match config {
                backend_api::UserConfigUpdate::Admin { bio } => {
                    let bio = bio.unwrap_or_else(|| match current_user_profile.config.clone() {
                        UserConfig::Admin { bio, .. } => bio,
                        UserConfig::Reviewer { bio, .. } => bio,
                        _ => "".to_string(),
                    });

                    current_user_profile.config = UserConfig::Admin { bio };
                }
                backend_api::UserConfigUpdate::Reviewer {
                    bio,
                    neuron_id,
                    wallet_address,
                } => {
                    let bio = bio.unwrap_or_else(|| match current_user_profile.config.clone() {
                        UserConfig::Admin { bio, .. } => bio,
                        UserConfig::Reviewer { bio, .. } => bio,
                        _ => "".to_string(),
                    });

                    let neuron_id =
                        neuron_id.unwrap_or(match current_user_profile.config {
                            UserConfig::Reviewer { neuron_id, .. } => neuron_id,
                            _ => 0,
                        });

                    let wallet_address =
                        wallet_address.unwrap_or_else(|| match current_user_profile.config {
                            UserConfig::Reviewer { wallet_address, .. } => wallet_address,
                            _ => "".to_string(),
                        });

                    current_user_profile.config = UserConfig::Reviewer {
                        bio,
                        neuron_id,
                        wallet_address,
                    };
                }
                backend_api::UserConfigUpdate::Anonymous => {
                    current_user_profile.config = UserConfig::Anonymous;
                }
            }
        }

        self.user_profile_repository.update_user_profile(
            calling_principal,
            user_id,
            current_user_profile,
        )?;

        Ok(())
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
    use crate::{
        fixtures::{self},
        repositories::MockUserProfileRepository,
    };
    use backend_api::{HistoryAction, HistoryEntry, UserConfigUpdate, UserProfileHistoryEntry};
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

        let result = service.get_my_user_profile(calling_principal).unwrap();

        assert_eq!(
            result,
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

        let result = service.get_my_user_profile(calling_principal).unwrap_err();

        assert_eq!(
            result,
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

        let result = service
            .get_my_user_profile_history(calling_principal)
            .unwrap();

        assert_eq!(
            result,
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

        let result = service
            .get_my_user_profile_history(calling_principal)
            .unwrap_err();

        assert_eq!(
            result,
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

        let result = service
            .create_my_user_profile(calling_principal)
            .await
            .unwrap();

        assert_eq!(
            result,
            CreateMyUserProfileResponse {
                id: id.to_string(),
                username: profile.username,
                config: profile.config.into(),
            }
        )
    }

    #[rstest]
    #[case(anonymous_username_update())]
    #[case(anonymous_admin_update())]
    #[case(anonymous_reviewer_update())]
    #[case(reviewer_admin_update())]
    #[case(admin_reviewer_update())]
    fn update_user_profile(#[case] fixture: (UserProfile, UpdateUserProfileRequest, UserProfile)) {
        let (original_profile, profile_update_request, updated_profile) = fixture;
        let calling_principal = fixtures::principal();
        let user_id = UserId::try_from(profile_update_request.user_id.as_str()).unwrap();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_by_user_id()
            .once()
            .with(eq(user_id))
            .return_const(Some(original_profile));
        repository_mock
            .expect_update_user_profile()
            .once()
            .with(eq(calling_principal), eq(user_id), eq(updated_profile))
            .return_const(Ok(()));

        let service = UserProfileServiceImpl::new(repository_mock);

        service
            .update_user_profile(calling_principal, profile_update_request)
            .unwrap();
    }

    #[fixture]
    fn anonymous_username_update() -> (UserProfile, UpdateUserProfileRequest, UserProfile) {
        let original_profile = fixtures::anonymous_user_profile();
        let username = "new_username".to_string();

        (
            original_profile,
            UpdateUserProfileRequest {
                user_id: fixtures::user_id().to_string(),
                username: Some(username.clone()),
                config: None,
            },
            UserProfile {
                username,
                ..fixtures::anonymous_user_profile()
            },
        )
    }

    #[fixture]
    fn anonymous_admin_update() -> (UserProfile, UpdateUserProfileRequest, UserProfile) {
        let original_profile = fixtures::anonymous_user_profile();
        let bio = "New bio...".to_string();

        (
            original_profile,
            UpdateUserProfileRequest {
                user_id: fixtures::user_id().to_string(),
                username: None,
                config: Some(UserConfigUpdate::Admin {
                    bio: Some(bio.clone()),
                }),
            },
            UserProfile {
                config: UserConfig::Admin { bio },
                ..fixtures::anonymous_user_profile()
            },
        )
    }

    #[fixture]
    fn anonymous_reviewer_update() -> (UserProfile, UpdateUserProfileRequest, UserProfile) {
        let original_profile = fixtures::anonymous_user_profile();
        let bio = "New bio...".to_string();
        let neuron_id = fixtures::neuron_id();
        let wallet_address = fixtures::wallet_address();

        (
            original_profile,
            UpdateUserProfileRequest {
                user_id: fixtures::user_id().to_string(),
                username: None,
                config: Some(UserConfigUpdate::Reviewer {
                    bio: Some(bio.clone()),
                    neuron_id: Some(neuron_id),
                    wallet_address: Some(wallet_address.clone()),
                }),
            },
            UserProfile {
                config: UserConfig::Reviewer {
                    bio,
                    neuron_id,
                    wallet_address,
                },
                ..fixtures::anonymous_user_profile()
            },
        )
    }

    #[fixture]
    fn reviewer_admin_update() -> (UserProfile, UpdateUserProfileRequest, UserProfile) {
        let original_profile = fixtures::reviewer_user_profile();
        let UserConfig::Reviewer {
            bio: original_bio, ..
        } = original_profile.config.clone()
        else {
            panic!("Invalid test setup");
        };

        (
            original_profile.clone(),
            UpdateUserProfileRequest {
                user_id: fixtures::user_id().to_string(),
                username: None,
                config: Some(UserConfigUpdate::Admin { bio: None }),
            },
            UserProfile {
                config: UserConfig::Admin { bio: original_bio },
                ..original_profile
            },
        )
    }

    #[fixture]
    fn admin_reviewer_update() -> (UserProfile, UpdateUserProfileRequest, UserProfile) {
        let original_profile = fixtures::admin_user_profile();
        let neuron_id = fixtures::neuron_id();
        let wallet_address = fixtures::wallet_address();
        let UserConfig::Admin {
            bio: original_bio, ..
        } = original_profile.config.clone()
        else {
            panic!("Invalid test setup");
        };

        (
            original_profile.clone(),
            UpdateUserProfileRequest {
                user_id: fixtures::user_id().to_string(),
                username: None,
                config: Some(UserConfigUpdate::Reviewer {
                    bio: None,
                    neuron_id: Some(neuron_id),
                    wallet_address: Some(wallet_address.clone()),
                }),
            },
            UserProfile {
                config: UserConfig::Reviewer {
                    bio: original_bio,
                    neuron_id,
                    wallet_address,
                },
                ..original_profile
            },
        )
    }
}
