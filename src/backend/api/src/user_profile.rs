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
    },

    #[serde(rename = "anonymous")]
    Anonymous,
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
