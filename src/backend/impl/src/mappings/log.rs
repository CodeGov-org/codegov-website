use crate::repositories::{DateTime, LogEntry, LogLevel, LogsFilter};

use backend_api::GetLogsResponse;

impl Into<LogsFilter> for backend_api::LogsFilterRequest {
    fn into(self) -> LogsFilter {
        LogsFilter {
            before: self
                .before_timestamp_ms
                .map(|t| DateTime::from_timestamp_micros(t * 1000).unwrap()),
            after: self
                .after_timestamp_ms
                .map(|t| DateTime::from_timestamp_micros(t * 1000).unwrap()),
            level: self.level.map(|l| l.into()),
            context_contains_any: self.context_contains_any,
            message_contains_any: self.message_contains_any,
        }
    }
}

impl Into<backend_api::LogsFilterRequest> for LogsFilter {
    fn into(self) -> backend_api::LogsFilterRequest {
        backend_api::LogsFilterRequest {
            before_timestamp_ms: self.before.map(|t| t.timestamp_micros() / 1000),
            after_timestamp_ms: self.after.map(|t| t.timestamp_micros() / 1000),
            level: self.level.map(|l| l.into()),
            context_contains_any: self.context_contains_any,
            message_contains_any: self.message_contains_any,
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

impl Into<LogLevel> for backend_api::LogLevel {
    fn into(self) -> LogLevel {
        match self {
            backend_api::LogLevel::Info => LogLevel::Info,
            backend_api::LogLevel::Warn => LogLevel::Warn,
            backend_api::LogLevel::Error => LogLevel::Error,
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
