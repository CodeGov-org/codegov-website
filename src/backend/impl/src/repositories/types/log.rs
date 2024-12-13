use super::DateTime;
use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};
use std::{borrow::Cow, ops::RangeBounds};

pub type LogId = u64;

#[derive(Default)]
pub struct LogsFilter {
    pub before: Option<DateTime>,
    pub after: Option<DateTime>,
    pub level: Option<LogLevel>,
    pub context_contains_any: Option<Vec<String>>,
    pub message_contains_any: Option<Vec<String>>,
}

impl LogsFilter {
    pub fn matches(&self, log_entry: &LogEntry) -> bool {
        if let Some(level) = &self.level {
            if log_entry.level != *level {
                return false;
            }
        }

        if let Some(context) = &self.context_contains_any {
            if !context.iter().any(|c| {
                log_entry
                    .context
                    .as_ref()
                    .is_some_and(|log_entry_context| log_entry_context.contains(c))
            }) {
                return false;
            }
        }

        if let Some(message) = &self.message_contains_any {
            if !message.iter().any(|m| log_entry.message.contains(m)) {
                return false;
            }
        }

        true
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct LogEntry {
    pub date_time: DateTime,
    pub level: LogLevel,
    pub context: Option<String>,
    pub message: String,
}

impl Storable for LogEntry {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct LogTimestampKey(Blob<{ Self::MAX_SIZE as usize }>);

impl LogTimestampKey {
    const MAX_SIZE: u32 = <(DateTime, LogId)>::BOUND.max_size();

    pub fn new(date_time: DateTime, log_id: LogId) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from((date_time, log_id).to_bytes().as_ref()).map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to convert date time {:?} and log id {} to bytes.",
                    date_time, log_id
                ))
            })?,
        ))
    }
}

impl Storable for LogTimestampKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

pub struct LogTimestampRange {
    start_bound: LogTimestampKey,
    end_bound: LogTimestampKey,
}

impl LogTimestampRange {
    pub fn new(
        min_date_time: Option<DateTime>,
        max_date_time: Option<DateTime>,
    ) -> Result<Self, ApiError> {
        let max_date_time = match max_date_time {
            Some(max_date_time) => max_date_time,
            None => DateTime::max()?,
        };
        Ok(Self {
            start_bound: LogTimestampKey::new(
                min_date_time.unwrap_or_else(DateTime::min),
                LogId::MIN,
            )?,
            end_bound: LogTimestampKey::new(max_date_time, LogId::MAX)?,
        })
    }
}

impl RangeBounds<LogTimestampKey> for LogTimestampRange {
    fn start_bound(&self) -> std::ops::Bound<&LogTimestampKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&LogTimestampKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{fixtures, system_api::get_date_time};
    use rstest::*;

    #[rstest]
    fn storable_impl() {
        let log_entry = fixtures::log_entry_info();
        let serialized_log = log_entry.to_bytes();
        let deserialized_log = LogEntry::from_bytes(serialized_log);

        assert_eq!(log_entry, deserialized_log);
    }

    #[rstest]
    #[case::empty_filter(fixtures::filters::empty_filter())]
    #[case::level_filter_matching(fixtures::filters::level_filter_matching())]
    #[case::level_filter_not_matching(fixtures::filters::level_filter_not_matching())]
    #[case::context_filter_matching(fixtures::filters::context_filter_matching())]
    #[case::context_filter_not_matching(fixtures::filters::context_filter_not_matching())]
    #[case::message_filter_matching(fixtures::filters::message_filter_matching())]
    #[case::message_filter_not_matching(fixtures::filters::message_filter_not_matching())]
    fn filter_matches(#[case] fixture: (LogEntry, LogsFilter, bool)) {
        let (log_entry, filter, expected) = fixture;

        assert_eq!(filter.matches(&log_entry), expected);
    }

    #[rstest]
    fn log_timestamp_key_storable_impl() {
        let date_time = get_date_time().unwrap();
        let log_id: LogId = 1234;

        let key = LogTimestampKey::new(DateTime::new(date_time).unwrap(), log_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = LogTimestampKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }
}
