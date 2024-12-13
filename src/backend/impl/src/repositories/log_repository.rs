use super::{
    init_log_timestamp_index, init_logs, DateTime, LogEntry, LogId, LogMemory,
    LogTimestampIndexMemory, LogTimestampKey, LogTimestampRange,
};
use backend_api::ApiError;
use std::cell::RefCell;

#[cfg_attr(test, mockall::automock)]
pub trait LogRepository {
    fn get_logs(
        &self,
        after: Option<DateTime>,
        before: Option<DateTime>,
    ) -> Result<Vec<LogEntry>, ApiError>;

    fn append_log(&self, log_entry: LogEntry) -> Result<LogId, ApiError>;
}

pub struct LogRepositoryImpl {}

impl Default for LogRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl LogRepository for LogRepositoryImpl {
    fn get_logs(
        &self,
        after: Option<DateTime>,
        before: Option<DateTime>,
    ) -> Result<Vec<LogEntry>, ApiError> {
        let range = LogTimestampRange::new(after, before)?;
        let logs = STATE.with_borrow(|s| {
            s.logs_timestamp_index
                .range(range)
                .filter_map(|(_, log_id)| {
                    // the None case should never happen
                    s.logs.get(log_id)
                })
                .collect()
        });
        Ok(logs)
    }

    fn append_log(&self, log_entry: LogEntry) -> Result<LogId, ApiError> {
        STATE.with_borrow_mut(|s| {
            let log_id = s
                .logs
                .append(&log_entry)
                .map_err(|e| ApiError::internal(&format!("Cannot write log: {:?}", e)))?;
            let log_key = LogTimestampKey::new(log_entry.date_time, log_id)?;
            s.logs_timestamp_index.insert(log_key, log_id);
            Ok(log_id)
        })
    }
}

impl LogRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct LogState {
    logs: LogMemory,
    logs_timestamp_index: LogTimestampIndexMemory,
}

impl Default for LogState {
    fn default() -> Self {
        Self {
            logs: init_logs(),
            logs_timestamp_index: init_log_timestamp_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<LogState> = RefCell::new(LogState::default());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{fixtures, repositories::LogsFilter};
    use rstest::*;

    #[rstest]
    #[case::before_filter_matching(fixtures::filters::before_filter_matching())]
    #[case::before_filter_not_matching(fixtures::filters::before_filter_not_matching())]
    #[case::after_filter_matching(fixtures::filters::after_filter_matching())]
    #[case::after_filter_not_matching(fixtures::filters::after_filter_not_matching())]
    #[case::time_range_filter_matching(fixtures::filters::time_range_filter_matching())]
    #[case::time_range_filter_not_matching(fixtures::filters::time_range_filter_not_matching())]
    async fn get_logs(#[case] fixture: (LogEntry, LogsFilter, bool)) {
        let (log_entry, filter, expected) = fixture;

        STATE.set(LogState::default());

        let repository = LogRepositoryImpl::default();
        repository.append_log(log_entry.clone()).unwrap();

        // ranges are tested in the service and controller above
        let result = repository.get_logs(filter.after, filter.before).unwrap();

        assert_eq!(result, if expected { vec![log_entry] } else { vec![] });
    }

    #[rstest]
    async fn append_log() {
        STATE.set(LogState::default());

        let log_entry = fixtures::log_entry_info();
        let repository = LogRepositoryImpl::default();
        let log_id = repository.append_log(log_entry.clone()).unwrap();

        let result = STATE.with_borrow(|s| s.logs.get(log_id));

        assert_eq!(result, Some(log_entry));
    }
}
