use crate::{
    fixtures::{date_time_a, principal},
    repositories::{HistoryAction, UserConfig, UserProfile, UserProfileHistoryEntry},
};
use rstest::*;

#[fixture]
pub fn neuron_id() -> u64 {
    7862326246190316138
}

#[fixture]
pub fn wallet_address() -> String {
    "da01eead5eb00bb853b9c42e1637433c81348a8856f4cff1bb917e2cd04df2cb".to_string()
}

#[fixture]
pub fn anonymous_user_profile() -> UserProfile {
    UserProfile {
        username: "AlpineAdventurer2023".to_string(),
        config: UserConfig::Anonymous,
    }
}

#[fixture]
pub fn reviewer_user_profile() -> UserProfile {
    UserProfile {
        username: "ZurichExplorer2023".to_string(),
        config: UserConfig::Reviewer {
            bio: "Active in the ICP community and on the developer forum.".to_string(),
            neuron_id: neuron_id(),
            wallet_address: wallet_address(),
        },
    }
}

#[fixture]
pub fn admin_user_profile() -> UserProfile {
    UserProfile {
        username: "AlpineAdventurer2023".to_string(),
        config: UserConfig::Admin {
            bio: "Active in the ICP community and on the developer forum.".to_string(),
        },
    }
}

#[fixture]
pub fn user_profile_history() -> Vec<UserProfileHistoryEntry> {
    vec![UserProfileHistoryEntry {
        action: HistoryAction::Create,
        principal: principal(),
        date_time: date_time_a(),
        data: UserProfile {
            ..reviewer_user_profile()
        },
    }]
}
