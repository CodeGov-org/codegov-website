use super::{DateTime, HistoryEntry, UserId, UserProfile};
use backend_api::ApiError;
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};
use std::ops::RangeBounds;

pub type UserProfileHistoryEntry = HistoryEntry<UserProfile>;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct UserProfileHistoryKey(Blob<{ Self::MAX_SIZE as usize }>);

impl UserProfileHistoryKey {
    const MAX_SIZE: u32 = <(UserId, (DateTime, u128))>::BOUND.max_size();

    pub fn new(user_id: UserId, date_time: DateTime, id: u128) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from((user_id, (date_time, id)).to_bytes().as_ref()).map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to convert date time {:?} and user id {:?} to bytes.",
                    date_time, user_id
                ))
            })?,
        ))
    }
}

impl Storable for UserProfileHistoryKey {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

pub struct UserProfileHistoryRange {
    start_bound: UserProfileHistoryKey,
    end_bound: UserProfileHistoryKey,
}

impl UserProfileHistoryRange {
    pub fn new(user_id: UserId) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: UserProfileHistoryKey::new(user_id, DateTime::min(), u128::MIN)?,
            end_bound: UserProfileHistoryKey::new(user_id, DateTime::max()?, u128::MAX)?,
        })
    }
}

impl RangeBounds<UserProfileHistoryKey> for UserProfileHistoryRange {
    fn start_bound(&self) -> std::ops::Bound<&UserProfileHistoryKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&UserProfileHistoryKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    fn storable_impl() {
        let key =
            UserProfileHistoryKey::new(fixtures::user_id(), fixtures::date_time_a(), 100).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = UserProfileHistoryKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }
}
