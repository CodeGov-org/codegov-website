use super::Uuid;
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
        neuron_id: u64,
        wallet_address: String,
    },
    Anonymous,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct UserProfile {
    pub username: String,
    pub config: UserConfig,
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
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;
    use rstest_reuse::*;

    #[template]
    #[rstest]
    #[case::anonymous_user(fixtures::anonymous_user_profile())]
    #[case::reviewer(fixtures::reviewer_user_profile())]
    #[case::admin(fixtures::admin_user_profile())]
    fn user_profiles(#[case] profile: UserProfile) {}

    #[apply(user_profiles)]
    fn storable_impl_admin(profile: UserProfile) {
        let serialized_user_profile = profile.to_bytes();
        let deserialized_user_profile = UserProfile::from_bytes(serialized_user_profile);

        assert_eq!(profile, deserialized_user_profile);
    }
}
