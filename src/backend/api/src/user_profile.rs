use crate::HistoryEntry;
use candid::{CandidType, Deserialize};

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum UserConfig {
    #[serde(rename = "admin")]
    Admin { bio: String },

    #[serde(rename = "reviewer")]
    Reviewer {
        bio: String,
        neuron_id: u64,
        wallet_address: String,
        social_links: Vec<SocialLink>,
    },

    #[serde(rename = "anonymous")]
    Anonymous,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum SocialLinkPlatform {
    #[serde(rename = "dscvr")]
    DSCVR,

    #[serde(rename = "openchat")]
    OpenChat,

    #[serde(rename = "taggr")]
    Taggr,

    #[serde(rename = "x")]
    X,

    #[serde(rename = "github")]
    GitHub,

    #[serde(rename = "dfinityforum")]
    DfinityForum,

    #[serde(rename = "discord")]
    Discord,

    #[serde(rename = "website")]
    Website,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct SocialLink {
    pub platform: SocialLinkPlatform,
    pub username: String,
}

#[derive(Debug, Clone, CandidType, PartialEq, Eq)]
pub struct GetMyUserProfileResponse {
    pub id: String,
    pub username: String,
    pub config: UserConfig,
}

#[derive(Debug, Clone, CandidType, PartialEq, Eq)]
pub struct CreateMyUserProfileResponse {
    pub id: String,
    pub username: String,
    pub config: UserConfig,
}

#[derive(Debug, Clone, CandidType, PartialEq, Eq)]
pub struct UserProfileHistoryEntry {
    pub username: String,
    pub config: UserConfig,
}

#[derive(Debug, Clone, CandidType, PartialEq, Eq)]
pub struct GetMyUserProfileHistoryResponse {
    pub history: Vec<HistoryEntry<UserProfileHistoryEntry>>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum MyUserConfigUpdate {
    #[serde(rename = "admin")]
    Admin { bio: Option<String> },

    #[serde(rename = "reviewer")]
    Reviewer {
        bio: Option<String>,
        wallet_address: Option<String>,
        social_links: Option<Vec<SocialLink>>,
    },

    #[serde(rename = "anonymous")]
    Anonymous,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateMyUserProfileRequest {
    pub username: Option<String>,
    pub config: Option<MyUserConfigUpdate>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum UserConfigUpdate {
    #[serde(rename = "admin")]
    Admin { bio: Option<String> },

    #[serde(rename = "reviewer")]
    Reviewer {
        bio: Option<String>,
        neuron_id: Option<u64>,
        wallet_address: Option<String>,
        social_links: Option<Vec<SocialLink>>,
    },

    #[serde(rename = "anonymous")]
    Anonymous,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateUserProfileRequest {
    pub user_id: String,
    pub username: Option<String>,
    pub config: Option<UserConfigUpdate>,
}
