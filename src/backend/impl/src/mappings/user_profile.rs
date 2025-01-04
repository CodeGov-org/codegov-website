use crate::repositories::{
    HistoryAction, SocialLink, SocialLinkPlatform, UserConfig, UserId, UserProfile,
    UserProfileHistoryEntry,
};
use backend_api::{
    CreateMyUserProfileResponse, GetMyUserProfileHistoryResponse, GetMyUserProfileResponse,
    HistoryEntry,
};

impl From<UserConfig> for backend_api::UserConfig {
    fn from(value: UserConfig) -> Self {
        match value {
            UserConfig::Admin { bio } => backend_api::UserConfig::Admin { bio },
            UserConfig::Reviewer {
                bio,
                neuron_id,
                wallet_address,
                social_links,
            } => backend_api::UserConfig::Reviewer {
                bio,
                neuron_id,
                wallet_address,
                social_links: social_links.into_iter().map(|link| link.into()).collect(),
            },
            UserConfig::Anonymous => backend_api::UserConfig::Anonymous,
        }
    }
}

impl From<SocialLinkPlatform> for backend_api::SocialLinkPlatform {
    fn from(value: SocialLinkPlatform) -> Self {
        match value {
            SocialLinkPlatform::Dscvr => backend_api::SocialLinkPlatform::DSCVR,
            SocialLinkPlatform::OpenChat => backend_api::SocialLinkPlatform::OpenChat,
            SocialLinkPlatform::Taggr => backend_api::SocialLinkPlatform::Taggr,
            SocialLinkPlatform::X => backend_api::SocialLinkPlatform::X,
            SocialLinkPlatform::GitHub => backend_api::SocialLinkPlatform::GitHub,
            SocialLinkPlatform::DfinityForum => backend_api::SocialLinkPlatform::DfinityForum,
            SocialLinkPlatform::Discord => backend_api::SocialLinkPlatform::Discord,
            SocialLinkPlatform::Website => backend_api::SocialLinkPlatform::Website,
        }
    }
}

impl From<backend_api::SocialLinkPlatform> for SocialLinkPlatform {
    fn from(value: backend_api::SocialLinkPlatform) -> Self {
        match value {
            backend_api::SocialLinkPlatform::DSCVR => SocialLinkPlatform::Dscvr,
            backend_api::SocialLinkPlatform::OpenChat => SocialLinkPlatform::OpenChat,
            backend_api::SocialLinkPlatform::Taggr => SocialLinkPlatform::Taggr,
            backend_api::SocialLinkPlatform::X => SocialLinkPlatform::X,
            backend_api::SocialLinkPlatform::GitHub => SocialLinkPlatform::GitHub,
            backend_api::SocialLinkPlatform::DfinityForum => SocialLinkPlatform::DfinityForum,
            backend_api::SocialLinkPlatform::Discord => SocialLinkPlatform::Discord,
            backend_api::SocialLinkPlatform::Website => SocialLinkPlatform::Website,
        }
    }
}

impl From<SocialLink> for backend_api::SocialLink {
    fn from(value: SocialLink) -> Self {
        backend_api::SocialLink {
            platform: value.platform.into(),
            username: value.username,
        }
    }
}

impl From<backend_api::SocialLink> for SocialLink {
    fn from(value: backend_api::SocialLink) -> Self {
        SocialLink {
            platform: value.platform.into(),
            username: value.username,
        }
    }
}

impl From<HistoryAction> for backend_api::HistoryAction {
    fn from(value: HistoryAction) -> Self {
        match value {
            HistoryAction::Create => backend_api::HistoryAction::Create,
            HistoryAction::Update => backend_api::HistoryAction::Update,
            HistoryAction::Delete => backend_api::HistoryAction::Delete,
            HistoryAction::Restore => backend_api::HistoryAction::Restore,
        }
    }
}

pub fn map_list_reviewer_profiles_response(
    profiles: Vec<(UserId, UserProfile)>,
) -> backend_api::ListReviewerProfilesResponse {
    backend_api::ListReviewerProfilesResponse {
        profiles: profiles
            .into_iter()
            .map(|(user_id, profile)| backend_api::UserProfile {
                id: user_id.to_string(),
                username: profile.username,
                config: profile.config.into(),
            })
            .collect(),
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

pub fn map_get_my_user_profile_history_response(
    history: Vec<UserProfileHistoryEntry>,
) -> GetMyUserProfileHistoryResponse {
    GetMyUserProfileHistoryResponse {
        history: history
            .into_iter()
            .map(|entry| HistoryEntry {
                action: entry.action.into(),
                date_time: entry.date_time.to_string(),
                user: entry.principal,
                data: backend_api::UserProfileHistoryEntry {
                    username: entry.data.username,
                    config: entry.data.config.into(),
                },
            })
            .collect(),
    }
}
