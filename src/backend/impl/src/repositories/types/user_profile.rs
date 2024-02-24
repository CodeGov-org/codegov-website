use super::{NeuronId, Uuid};
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};
use std::borrow::Cow;

pub type UserId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum UserConfig {
    Admin {
        bio: String,
    },
    Reviewer {
        bio: String,
        neuron_id: NeuronId,
        wallet_address: String,
        social_links: Vec<SocialLink>,
    },
    Anonymous,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct UserProfile {
    pub username: String,
    pub config: UserConfig,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum SocialLinkPlatform {
    #[serde(rename = "dscvr")]
    Dscvr,

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

    #[serde(rename = "Discord")]
    Discord,

    #[serde(rename = "website")]
    Website,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct SocialLink {
    pub platform: SocialLinkPlatform,
    pub username: String,
}

impl UserProfile {
    pub fn new_anonymous() -> Self {
        Self {
            username: "Anonymous".to_string(),
            config: UserConfig::Anonymous,
        }
    }

    pub fn new_admin() -> Self {
        Self {
            username: "Admin".to_string(),
            config: UserConfig::Admin {
                bio: "Default admin profile created for canister controllers".to_string(),
            },
        }
    }
}

impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
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
    fn storable_impl(#[case] profile: UserProfile) {
        let serialized_user_profile = profile.to_bytes();
        let deserialized_user_profile = UserProfile::from_bytes(serialized_user_profile);

        assert_eq!(profile, deserialized_user_profile);
    }
}
