use super::DateTime;
use crate::system_api::get_date_time;
use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use std::borrow::Cow;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum HistoryAction {
    Create,
    Update,
    Delete,
    Restore,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct HistoryEntry<T> {
    pub action: HistoryAction,
    pub date_time: DateTime,
    pub principal: Principal,
    pub data: T,
}

impl<T> Storable for HistoryEntry<T>
where
    T: CandidType + for<'de> Deserialize<'de>,
{
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(&bytes, Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl<T> HistoryEntry<T> {
    fn new(action: HistoryAction, principal: Principal, data: T) -> Result<Self, ApiError> {
        let date_time = get_date_time()?;

        Ok(Self {
            action,
            date_time: DateTime::new(date_time)?,
            principal,
            data,
        })
    }

    pub fn create_action(calling_principal: Principal, data: T) -> Result<Self, ApiError> {
        Self::new(HistoryAction::Create, calling_principal, data)
    }

    pub fn update_action(calling_principal: Principal, data: T) -> Result<Self, ApiError> {
        Self::new(HistoryAction::Update, calling_principal, data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{fixtures, repositories::UserProfileHistoryEntry};
    use rstest::*;

    #[rstest]
    #[case::create_action(create_action())]
    #[case::update_date(update_action())]
    fn storable_impl_user_profile(#[case] history_entry: UserProfileHistoryEntry) {
        let bytes = history_entry.to_bytes();
        let deserialized_history_entry = HistoryEntry::from_bytes(bytes);

        assert_eq!(history_entry, deserialized_history_entry);
    }

    #[fixture]
    fn create_action() -> UserProfileHistoryEntry {
        let user_profile = fixtures::reviewer_user_profile();
        let principal = fixtures::principal();

        HistoryEntry::create_action(principal, user_profile).unwrap()
    }

    #[fixture]
    fn update_action() -> UserProfileHistoryEntry {
        let user_profile = fixtures::reviewer_user_profile();
        let principal = fixtures::principal();

        HistoryEntry::update_action(principal, user_profile).unwrap()
    }
}
