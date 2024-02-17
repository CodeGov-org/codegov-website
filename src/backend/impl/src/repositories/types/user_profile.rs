use super::{NeuronId, Uuid};
use crate::system_api::get_random_string;
use backend_api::ApiError;
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
    },
    Anonymous,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct UserProfile {
    pub username: String,
    pub config: UserConfig,
}

impl UserProfile {
    pub async fn new_anonymous() -> Result<Self, ApiError> {
        let username = Self::random_username("Anonymous").await?;

        Ok(Self {
            username,
            config: UserConfig::Anonymous,
        })
    }

    pub async fn new_admin() -> Result<Self, ApiError> {
        let username = Self::random_username("Admin").await?;

        Ok(Self {
            username,
            config: UserConfig::Admin {
                bio: "Default admin profile created for canister controllers".to_string(),
            },
        })
    }

    async fn random_username(prefix: &str) -> Result<String, ApiError> {
        let postfix = get_random_string(8).await?;

        Ok(format!("{}_{}", prefix, postfix))
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

    #[rstest]
    async fn new_anonymous() {
        let profile = UserProfile::new_anonymous().await.unwrap();

        assert_eq!(profile.config, UserConfig::Anonymous);
        assert!(profile.username.starts_with("Anonymous_"));
    }

    #[rstest]
    async fn new_admin() {
        let profile = UserProfile::new_admin().await.unwrap();

        assert_eq!(
            profile.config,
            UserConfig::Admin {
                bio: "Default admin profile created for canister controllers".to_string()
            }
        );
        assert!(profile.username.starts_with("Admin_"));
    }
}
