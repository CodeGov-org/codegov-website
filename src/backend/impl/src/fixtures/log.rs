use crate::{
    fixtures::{date_time_a, date_time_b, date_time_c},
    repositories::{LogEntry, LogLevel},
};
use rstest::*;

#[fixture]
pub fn log_entry_info() -> LogEntry {
    LogEntry {
        date_time: date_time_b(),
        level: LogLevel::Info,
        context: Some("function_a".to_string()),
        message: "foo".to_string(),
    }
}

#[fixture]
pub fn log_entry_warn() -> LogEntry {
    LogEntry {
        date_time: date_time_b(),
        level: LogLevel::Warn,
        context: Some("function_a".to_string()),
        message: "foo".to_string(),
    }
}

#[fixture]
pub fn log_entry_error() -> LogEntry {
    LogEntry {
        date_time: date_time_b(),
        level: LogLevel::Error,
        context: Some("function_a".to_string()),
        message: "foo".to_string(),
    }
}

pub mod filters {
    use crate::repositories::LogsFilter;

    use super::*;

    #[fixture]
    pub fn empty_filter() -> (LogEntry, LogsFilter, bool) {
        (log_entry_info(), LogsFilter::default(), true)
    }

    #[fixture]
    pub fn before_filter_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                date_time: date_time_b(),
                ..log_entry_info()
            },
            LogsFilter {
                before: Some(date_time_a()),
                ..Default::default()
            },
            true,
        )
    }

    #[fixture]
    pub fn before_filter_not_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                date_time: date_time_a(),
                ..log_entry_info()
            },
            LogsFilter {
                before: Some(date_time_b()),
                ..Default::default()
            },
            false,
        )
    }

    #[fixture]
    pub fn after_filter_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                date_time: date_time_b(),
                ..log_entry_info()
            },
            LogsFilter {
                after: Some(date_time_c()),
                ..Default::default()
            },
            true,
        )
    }

    #[fixture]
    pub fn after_filter_not_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                date_time: date_time_b(),
                ..log_entry_info()
            },
            LogsFilter {
                after: Some(date_time_a()),
                ..Default::default()
            },
            false,
        )
    }

    #[fixture]
    pub fn time_range_filter_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                date_time: date_time_b(),
                ..log_entry_info()
            },
            LogsFilter {
                before: Some(date_time_a()),
                after: Some(date_time_c()),
                ..Default::default()
            },
            true,
        )
    }

    #[fixture]
    pub fn time_range_filter_not_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                date_time: date_time_a(),
                ..log_entry_info()
            },
            LogsFilter {
                before: Some(date_time_b()),
                after: Some(date_time_c()),
                ..Default::default()
            },
            false,
        )
    }

    #[fixture]
    pub fn level_filter_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                level: LogLevel::Info,
                ..log_entry_info()
            },
            LogsFilter {
                level: Some(LogLevel::Info),
                ..Default::default()
            },
            true,
        )
    }

    #[fixture]
    pub fn level_filter_not_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                level: LogLevel::Warn,
                ..log_entry_info()
            },
            LogsFilter {
                level: Some(LogLevel::Info),
                ..Default::default()
            },
            false,
        )
    }

    #[fixture]
    pub fn context_filter_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                context: Some("my_function".to_string()),
                ..log_entry_info()
            },
            LogsFilter {
                context_contains_any: Some(vec!["function".to_string(), "no match".to_string()]),
                ..Default::default()
            },
            true,
        )
    }

    #[fixture]
    pub fn context_filter_not_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                context: Some("my_function".to_string()),
                ..log_entry_info()
            },
            LogsFilter {
                context_contains_any: Some(vec!["no match".to_string()]),
                ..Default::default()
            },
            false,
        )
    }

    #[fixture]
    pub fn message_filter_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                message: "foo".to_string(),
                ..log_entry_info()
            },
            LogsFilter {
                message_contains_any: Some(vec!["fo".to_string(), "bar".to_string()]),
                ..Default::default()
            },
            true,
        )
    }

    #[fixture]
    pub fn message_filter_not_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                message: "foo".to_string(),
                ..log_entry_info()
            },
            LogsFilter {
                message_contains_any: Some(vec!["bar".to_string()]),
                ..Default::default()
            },
            false,
        )
    }

    #[fixture]
    pub fn all_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                date_time: date_time_b(),
                level: LogLevel::Info,
                context: Some("my_function".to_string()),
                message: "foo".to_string(),
            },
            LogsFilter {
                before: Some(date_time_a()),
                after: Some(date_time_c()),
                level: Some(LogLevel::Info),
                context_contains_any: Some(vec!["function".to_string(), "no match".to_string()]),
                message_contains_any: Some(vec!["fo".to_string(), "bar".to_string()]),
            },
            true,
        )
    }

    #[fixture]
    pub fn all_not_matching() -> (LogEntry, LogsFilter, bool) {
        (
            LogEntry {
                date_time: date_time_b(),
                level: LogLevel::Info,
                context: Some("my_function".to_string()),
                message: "foo".to_string(),
            },
            LogsFilter {
                before: Some(date_time_b()),
                after: Some(date_time_c()),
                level: Some(LogLevel::Warn),
                context_contains_any: Some(vec!["no match".to_string()]),
                message_contains_any: Some(vec!["bar".to_string()]),
            },
            false,
        )
    }
}
