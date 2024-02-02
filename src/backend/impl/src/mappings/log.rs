use crate::repositories::{DateTime, LogEntry, LogsFilter};

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
            context_contains_any: self.context_contains_any,
            message_contains_any: self.message_contains_any,
        }
    }
}

impl From<LogEntry> for backend_api::LogEntry {
    fn from(value: LogEntry) -> Self {
        Self {
            date_time: value.date_time.to_string(),
            context: value.context,
            message: value.message,
        }
    }
}

pub fn map_logs_filter_request(request: backend_api::LogsFilterRequest) -> LogsFilter {
    request.into()
}

pub fn map_get_logs_response(logs: Vec<LogEntry>) -> GetLogsResponse {
    logs.into_iter().map(backend_api::LogEntry::from).collect()
}
