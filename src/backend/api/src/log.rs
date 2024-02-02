use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct LogsFilterRequest {
    pub before_timestamp_ms: Option<u64>,
    pub after_timestamp_ms: Option<u64>,
    pub context_contains_any: Option<Vec<String>>,
    pub message_contains_any: Option<Vec<String>>,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct LogEntry {
    pub date_time: String,
    pub context: Option<String>,
    pub message: String,
}

pub type GetLogsResponse = Vec<LogEntry>;
