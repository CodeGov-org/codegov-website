use super::DateTime;
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};
use std::borrow::Cow;

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
        if let Some(before) = &self.before {
            if log_entry.date_time > *before {
                return false;
            }
        }

        if let Some(after) = &self.after {
            if log_entry.date_time < *after {
                return false;
            }
        }

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
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
    #[case::before_filter_matching(fixtures::filters::before_filter_matching())]
    #[case::before_filter_not_matching(fixtures::filters::before_filter_not_matching())]
    #[case::after_filter_matching(fixtures::filters::after_filter_matching())]
    #[case::after_filter_not_matching(fixtures::filters::after_filter_not_matching())]
    #[case::time_range_filter_matching(fixtures::filters::time_range_filter_matching())]
    #[case::time_range_filter_not_matching(fixtures::filters::time_range_filter_not_matching())]
    #[case::level_filter_matching(fixtures::filters::level_filter_matching())]
    #[case::level_filter_not_matching(fixtures::filters::level_filter_not_matching())]
    #[case::context_filter_matching(fixtures::filters::context_filter_matching())]
    #[case::context_filter_not_matching(fixtures::filters::context_filter_not_matching())]
    #[case::message_filter_matching(fixtures::filters::message_filter_matching())]
    #[case::message_filter_not_matchingd(fixtures::filters::message_filter_not_matching())]
    #[case::all_matching(fixtures::filters::all_matching())]
    #[case::all_not_matching(fixtures::filters::all_not_matching())]
    fn filter_matches(#[case] fixture: (LogEntry, LogsFilter, bool)) {
        let (log_entry, filter, expected) = fixture;

        assert_eq!(filter.matches(&log_entry), expected);
    }
}
