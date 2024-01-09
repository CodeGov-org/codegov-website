use crate::repositories::{UserConfig, UserId, UserProfile};
use backend_api::{CreateMyUserProfileResponse, GetMyUserProfileResponse};

impl From<UserConfig> for backend_api::UserConfig {
    fn from(value: UserConfig) -> Self {
        match value {
            UserConfig::Admin { bio } => backend_api::UserConfig::Admin { bio },
            UserConfig::Reviewer {
                bio,
                neuron_id,
                wallet_address,
            } => backend_api::UserConfig::Reviewer {
                bio,
                neuron_id,
                wallet_address,
            },
            UserConfig::Anonymous => backend_api::UserConfig::Anonymous,
        }
    }
}

pub fn map_get_my_user_profile_response(
    user_id: UserId,
    user_profile: UserProfile,
) -> GetMyUserProfileResponse {
    GetMyUserProfileResponse {
        id: user_id.to_string(),
        username: user_profile.username,
        config: user_profile.config.into(),
    }
}

pub fn map_create_my_user_profile_response(
    user_id: UserId,
    user_profile: UserProfile,
) -> CreateMyUserProfileResponse {
    CreateMyUserProfileResponse {
        id: user_id.to_string(),
        username: user_profile.username,
        config: user_profile.config.into(),
    }
}
