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
    GetMyUserProfileResponse, UpdateMyUserProfileRequest, UpdateUserProfileRequest,
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

    fn update_my_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateMyUserProfileRequest,
    ) -> Result<(), ApiError>;

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
        if self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .is_some()
        {
            return Err(ApiError::conflict(&format!(
                "User profile for principal {} already exists",
                calling_principal.to_text()
            )));
        }

        let profile = UserProfile::new_anonymous();
        let id = self
            .user_profile_repository
            .create_user_profile(calling_principal, profile.clone())
            .await?;

        Ok(map_create_my_user_profile_response(id, profile))
    }

    fn update_my_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateMyUserProfileRequest,
    ) -> Result<(), ApiError> {
        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let mut current_user_profile = self
            .user_profile_repository
            .get_user_profile_by_user_id(&user_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        if let Some(username) = request.username {
            current_user_profile.username = username;
        }

        current_user_profile.config = match (request.config, current_user_profile.config) {
            (
                Some(backend_api::MyUserConfigUpdate::Admin { bio: bio_update }),
                UserConfig::Admin { bio },
            ) => UserConfig::Admin {
                bio: bio_update.unwrap_or(bio),
            },
            (
                Some(backend_api::MyUserConfigUpdate::Reviewer {
                    bio: bio_update,
                    wallet_address: wallet_address_update,
                    social_links: social_links_update,
                }),
                UserConfig::Reviewer {
                    bio,
                    neuron_id,
                    wallet_address,
                    social_links,
                },
            ) => UserConfig::Reviewer {
                bio: bio_update.unwrap_or(bio),
                neuron_id,
                wallet_address: wallet_address_update.unwrap_or(wallet_address),
                social_links: match social_links_update {
                    Some(links) => links
                        .into_iter()
                        .map(|link| link.into())
                        .collect::<Vec<_>>(),
                    None => social_links,
                },
            },
            (Some(backend_api::MyUserConfigUpdate::Anonymous), UserConfig::Anonymous) => {
                UserConfig::Anonymous
            }
            (None, existing_config) => existing_config,
            (_, _) => {
                return Err(ApiError::permission_denied(
                    "Users are not allowed to change their own role",
                ))
            }
        };

        self.user_profile_repository.update_user_profile(
            calling_principal,
            user_id,
            current_user_profile,
        )?;

        Ok(())
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
                    social_links,
                } => {
                    let bio = bio.unwrap_or_else(|| match current_user_profile.config.clone() {
                        UserConfig::Admin { bio, .. } => bio,
                        UserConfig::Reviewer { bio, .. } => bio,
                        _ => "".to_string(),
                    });

                    let neuron_id = neuron_id.unwrap_or(match current_user_profile.config {
                        UserConfig::Reviewer { neuron_id, .. } => neuron_id,
                        _ => 0,
                    });

                    let wallet_address =
                        wallet_address.unwrap_or_else(|| {
                            match current_user_profile.clone().config {
                                UserConfig::Reviewer { wallet_address, .. } => wallet_address,
                                _ => "".to_string(),
                            }
                        });

                    let social_links = match social_links {
                        Some(links) => links
                            .into_iter()
                            .map(|link| link.into())
                            .collect::<Vec<_>>(),
                        None => match current_user_profile.config {
                            UserConfig::Reviewer { social_links, .. } => social_links,
                            _ => vec![],
                        },
                    };

                    current_user_profile.config = UserConfig::Reviewer {
                        bio,
                        neuron_id,
                        wallet_address,
                        social_links,
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
    use backend_api::{
        HistoryAction, HistoryEntry, MyUserConfigUpdate, UserConfigUpdate, UserProfileHistoryEntry,
    };
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
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
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
    async fn create_my_user_profile_existing_profile() {
        let calling_principal = fixtures::principal();
        let id = fixtures::user_id();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(id));
        repository_mock.expect_create_user_profile().never();

        let service = UserProfileServiceImpl::new(repository_mock);

        let result = service
            .create_my_user_profile(calling_principal)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "User profile for principal {} already exists",
                calling_principal.to_text()
            ))
        )
    }

    #[rstest]
    #[case(my_anonymous_update())]
    #[case(my_admin_update())]
    #[case(my_reviewer_update())]
    fn update_my_user_profile(
        #[case] fixture: (UserProfile, UpdateMyUserProfileRequest, UserProfile),
    ) {
        let (original_profile, profile_update_request, updated_profile) = fixture;
        let calling_principal = fixtures::principal();
        let user_id = UserId::try_from(fixtures::user_id().to_string().as_str()).unwrap();

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
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
            .update_my_user_profile(calling_principal, profile_update_request)
            .unwrap();
    }

    #[fixture]
    fn my_anonymous_update() -> (UserProfile, UpdateMyUserProfileRequest, UserProfile) {
        let original_profile = fixtures::anonymous_user_profile();
        let username = "new_username".to_string();

        (
            original_profile.clone(),
            UpdateMyUserProfileRequest {
                username: Some(username.clone()),
                config: None,
            },
            UserProfile {
                username,
                ..original_profile
            },
        )
    }

    #[fixture]
    fn my_admin_update() -> (UserProfile, UpdateMyUserProfileRequest, UserProfile) {
        let original_profile = fixtures::admin_user_profile();
        let bio = "New bio...".to_string();

        (
            original_profile.clone(),
            UpdateMyUserProfileRequest {
                username: None,
                config: Some(MyUserConfigUpdate::Admin {
                    bio: Some(bio.clone()),
                }),
            },
            UserProfile {
                config: UserConfig::Admin { bio },
                ..original_profile
            },
        )
    }

    #[fixture]
    fn my_reviewer_update() -> (UserProfile, UpdateMyUserProfileRequest, UserProfile) {
        let original_profile = fixtures::reviewer_user_profile();
        let neuron_id = fixtures::neuron_id();
        let wallet_address = fixtures::wallet_address();
        let social_links = vec![
            fixtures::dscvr_social_link(),
            fixtures::open_chat_social_link(),
        ];
        let bio = "New bio...".to_string();

        (
            original_profile.clone(),
            UpdateMyUserProfileRequest {
                username: None,
                config: Some(MyUserConfigUpdate::Reviewer {
                    bio: Some(bio.clone()),
                    wallet_address: None,
                    social_links: None,
                }),
            },
            UserProfile {
                config: UserConfig::Reviewer {
                    bio,
                    neuron_id,
                    wallet_address,
                    social_links,
                },
                ..original_profile
            },
        )
    }

    #[rstest]
    fn update_my_user_profile_no_user_id() {
        let calling_principal = fixtures::principal();
        let request = UpdateMyUserProfileRequest {
            username: None,
            config: None,
        };

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        repository_mock.expect_get_user_profile_by_user_id().never();
        repository_mock.expect_update_user_profile().never();

        let service = UserProfileServiceImpl::new(repository_mock);

        let result = service
            .update_my_user_profile(calling_principal, request)
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "User id for principal {} not found",
                calling_principal.to_text()
            ))
        )
    }

    #[rstest]
    fn update_my_user_profile_no_profile() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let request = UpdateMyUserProfileRequest {
            username: None,
            config: None,
        };

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        repository_mock
            .expect_get_user_profile_by_user_id()
            .once()
            .with(eq(user_id))
            .return_const(None);
        repository_mock.expect_update_user_profile().never();

        let service = UserProfileServiceImpl::new(repository_mock);

        let result = service
            .update_my_user_profile(calling_principal, request)
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "User profile for principal {} not found",
                calling_principal.to_text()
            ))
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
        let social_links = vec![fixtures::taggr_social_link()];

        (
            original_profile,
            UpdateUserProfileRequest {
                user_id: fixtures::user_id().to_string(),
                username: None,
                config: Some(UserConfigUpdate::Reviewer {
                    bio: Some(bio.clone()),
                    neuron_id: Some(neuron_id),
                    wallet_address: Some(wallet_address.clone()),
                    social_links: Some(
                        social_links
                            .clone()
                            .into_iter()
                            .map(|link| link.into())
                            .collect(),
                    ),
                }),
            },
            UserProfile {
                config: UserConfig::Reviewer {
                    bio,
                    neuron_id,
                    wallet_address,
                    social_links,
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
        let social_links = vec![fixtures::taggr_social_link()];

        (
            original_profile.clone(),
            UpdateUserProfileRequest {
                user_id: fixtures::user_id().to_string(),
                username: None,
                config: Some(UserConfigUpdate::Reviewer {
                    bio: None,
                    neuron_id: Some(neuron_id),
                    wallet_address: Some(wallet_address.clone()),
                    social_links: Some(
                        social_links
                            .clone()
                            .into_iter()
                            .map(|link| link.into())
                            .collect(),
                    ),
                }),
            },
            UserProfile {
                config: UserConfig::Reviewer {
                    bio: original_bio,
                    neuron_id,
                    wallet_address,
                    social_links,
                },
                ..original_profile
            },
        )
    }

    #[rstest]
    fn update_user_profile_no_profile() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let request = UpdateUserProfileRequest {
            user_id: user_id.to_string(),
            username: None,
            config: None,
        };

        let mut repository_mock = MockUserProfileRepository::new();
        repository_mock
            .expect_get_user_profile_by_user_id()
            .once()
            .with(eq(user_id))
            .return_const(None);
        repository_mock.expect_update_user_profile().never();

        let service = UserProfileServiceImpl::new(repository_mock);

        let result = service
            .update_user_profile(calling_principal, request)
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "User profile for user with id {} not found",
                user_id.to_string()
            ))
        )
    }
}
