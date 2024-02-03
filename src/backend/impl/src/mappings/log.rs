use crate::repositories::{DateTime, LogEntry, LogLevel, LogsFilter};

use backend_api::GetLogsResponse;

impl From<backend_api::LogsFilterRequest> for LogsFilter {
    fn from(value: backend_api::LogsFilterRequest) -> Self {
        Self {
            before: value
                .before_timestamp_ms
                .map(|t| DateTime::from_timestamp_micros(t * 1000).unwrap()),
            after: value
                .after_timestamp_ms
                .map(|t| DateTime::from_timestamp_micros(t * 1000).unwrap()),
            level: value.level.map(|l| l.into()),
            context_contains_any: value.context_contains_any,
            message_contains_any: value.message_contains_any,
        }
    }
}

impl From<LogsFilter> for backend_api::LogsFilterRequest {
    fn from(value: LogsFilter) -> Self {
        Self {
            before_timestamp_ms: value.before.map(|t| t.timestamp_micros() / 1000),
            after_timestamp_ms: value.after.map(|t| t.timestamp_micros() / 1000),
            level: value.level.map(|l| l.into()),
            context_contains_any: value.context_contains_any,
            message_contains_any: value.message_contains_any,
        }
    }
}

impl From<LogEntry> for backend_api::LogEntry {
    fn from(value: LogEntry) -> Self {
        Self {
            date_time: value.date_time.to_string(),
            level: value.level.into(),
            context: value.context,
            message: value.message,
        }
    }
}

impl From<backend_api::LogLevel> for LogLevel {
    fn from(value: backend_api::LogLevel) -> Self {
        match value {
            backend_api::LogLevel::Info => Self::Info,
            backend_api::LogLevel::Warn => Self::Warn,
            backend_api::LogLevel::Error => Self::Error,
        }
    }
}

impl From<LogLevel> for backend_api::LogLevel {
    fn from(value: LogLevel) -> Self {
        match value {
            LogLevel::Info => Self::Info,
            LogLevel::Warn => Self::Warn,
            LogLevel::Error => Self::Error,
        }
    }
}

pub fn map_logs_filter_request(request: backend_api::LogsFilterRequest) -> LogsFilter {
    request.into()
}

pub fn map_get_logs_response(logs: Vec<LogEntry>) -> GetLogsResponse {
    logs.into_iter().map(backend_api::LogEntry::from).collect()
}
