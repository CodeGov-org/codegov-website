use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct LogsFilterRequest {
    pub before_timestamp_ms: Option<u64>,
    pub after_timestamp_ms: Option<u64>,
    pub level: Option<LogLevel>,
    pub context_contains_any: Option<Vec<String>>,
    pub message_contains_any: Option<Vec<String>>,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum LogLevel {
    #[serde(rename = "info")]
    Info,
    #[serde(rename = "warn")]
    Warn,
    #[serde(rename = "error")]
    Error,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct LogEntry {
    pub date_time: String,
    pub level: LogLevel,
    pub context: Option<String>,
    pub message: String,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct ListLogsResponse {
    pub logs: Vec<LogEntry>,
}
