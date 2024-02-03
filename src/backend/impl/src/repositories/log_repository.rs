use super::{init_logs, LogEntry, LogId, LogMemory};
use backend_api::ApiError;
use std::cell::RefCell;

#[cfg_attr(test, mockall::automock)]
pub trait LogRepository {
    fn get_logs(&self) -> Vec<LogEntry>;

    fn append_log(&self, log_entry: LogEntry) -> Result<LogId, ApiError>;
}

pub struct LogRepositoryImpl {}

impl Default for LogRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl LogRepository for LogRepositoryImpl {
    fn get_logs(&self) -> Vec<LogEntry> {
        STATE.with_borrow(|s| s.logs.iter().collect::<Vec<_>>())
    }

    fn append_log(&self, log_entry: LogEntry) -> Result<LogId, ApiError> {
        STATE
            .with_borrow_mut(|s| s.logs.append(&log_entry))
            .map_err(|e| ApiError::internal(&format!("Cannot write log: {:?}", e)))
    }
}

impl LogRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct LogState {
    logs: LogMemory,
}

impl Default for LogState {
    fn default() -> Self {
        Self { logs: init_logs() }
    }
}

thread_local! {
    static STATE: RefCell<LogState> = RefCell::new(LogState::default());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    async fn get_logs() {
        STATE.set(LogState::default());

        let log_entries = fixtures::log_entries();
        let repository = LogRepositoryImpl::default();

        for log_entry in log_entries.iter() {
            repository.append_log(log_entry.clone()).unwrap();
        }

        let result = repository.get_logs();

        assert_eq!(result, log_entries);
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
