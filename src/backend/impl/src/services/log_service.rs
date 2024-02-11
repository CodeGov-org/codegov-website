use crate::{
    mappings::{map_list_logs_response, map_logs_filter_request},
    repositories::{DateTime, LogEntry, LogLevel, LogRepository, LogRepositoryImpl},
    system_api::get_date_time,
};
use backend_api::{ApiError, ListLogsResponse, LogsFilterRequest};

#[cfg_attr(test, mockall::automock)]
pub trait LogService {
    fn list_logs(&self, filter: LogsFilterRequest) -> ListLogsResponse;

    fn append_log(
        &self,
        level: LogLevel,
        message: String,
        context: Option<String>,
    ) -> Result<(), ApiError>;

    fn log_info(&self, message: String, context: Option<String>) -> Result<(), ApiError>;

    fn log_warn(&self, message: String, context: Option<String>) -> Result<(), ApiError>;

    fn log_error(&self, message: String, context: Option<String>) -> Result<(), ApiError>;
}

pub struct LogServiceImpl<T: LogRepository> {
    log_repository: T,
}

impl Default for LogServiceImpl<LogRepositoryImpl> {
    fn default() -> Self {
        Self::new(LogRepositoryImpl::default())
    }
}

impl<T: LogRepository> LogService for LogServiceImpl<T> {
    fn list_logs(&self, request: LogsFilterRequest) -> ListLogsResponse {
        let filter = map_logs_filter_request(request);

        let logs = self
            .log_repository
            .get_logs()
            .iter()
            .filter(|l| filter.matches(l))
            .cloned()
            .collect::<Vec<_>>();

        map_list_logs_response(logs)
    }

    fn append_log(
        &self,
        level: LogLevel,
        message: String,
        context: Option<String>,
    ) -> Result<(), ApiError> {
        let date_time = get_date_time()?;

        let log_entry = LogEntry {
            date_time: DateTime::new(date_time)?,
            level,
            context,
            message,
        };

        self.log_repository.append_log(log_entry).map(|_| ())
    }

    fn log_info(&self, message: String, context: Option<String>) -> Result<(), ApiError> {
        self.append_log(LogLevel::Info, message, context)
    }

    fn log_warn(&self, message: String, context: Option<String>) -> Result<(), ApiError> {
        self.append_log(LogLevel::Warn, message, context)
    }

    fn log_error(&self, message: String, context: Option<String>) -> Result<(), ApiError> {
        self.append_log(LogLevel::Error, message, context)
    }
}

impl<T: LogRepository> LogServiceImpl<T> {
    fn new(log_repository: T) -> Self {
        Self { log_repository }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures::{self},
        repositories::{LogEntry, LogsFilter, MockLogRepository},
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    fn list_logs_empty_filter() {
        let (log_entry, filter, _) = fixtures::filters::empty_filter();

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_get_logs()
            .once()
            .return_const(vec![log_entry.clone(), log_entry.clone()]);

        let service = LogServiceImpl::new(repository_mock);

        let result = service.list_logs(filter.into());

        assert_eq!(
            result,
            map_list_logs_response(vec![log_entry.clone(), log_entry])
        );
    }

    #[rstest]
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
    fn list_logs(#[case] fixture: (LogEntry, LogsFilter, bool)) {
        let (log_entry, filter, expected) = fixture;

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_get_logs()
            .once()
            .return_const(vec![log_entry.clone()]);

        let service = LogServiceImpl::new(repository_mock);

        let result = service.list_logs(filter.into());

        assert_eq!(
            result,
            if expected {
                map_list_logs_response(vec![log_entry])
            } else {
                ListLogsResponse { logs: vec![] }
            }
        );
    }

    #[rstest]
    fn append_log() {
        let log_id = 0u64;
        let log_entry = fixtures::log_entry_info();

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_append_log()
            .once()
            .with(eq(LogEntry {
                date_time: DateTime::new(get_date_time().unwrap()).unwrap(),
                ..log_entry.clone()
            }))
            .return_const(Ok(log_id));

        let service = LogServiceImpl::new(repository_mock);

        service
            .append_log(log_entry.level, log_entry.message, log_entry.context)
            .unwrap();
    }

    #[rstest]
    fn log_info() {
        let log_id = 0u64;
        let log_entry = fixtures::log_entry_info();

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_append_log()
            .once()
            .with(eq(LogEntry {
                date_time: DateTime::new(get_date_time().unwrap()).unwrap(),
                ..log_entry.clone()
            }))
            .return_const(Ok(log_id));

        let service = LogServiceImpl::new(repository_mock);

        service
            .log_info(log_entry.message, log_entry.context)
            .unwrap();
    }

    #[rstest]
    fn log_warn() {
        let log_id = 0u64;
        let log_entry = fixtures::log_entry_warn();

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_append_log()
            .once()
            .with(eq(LogEntry {
                date_time: DateTime::new(get_date_time().unwrap()).unwrap(),
                ..log_entry.clone()
            }))
            .return_const(Ok(log_id));

        let service = LogServiceImpl::new(repository_mock);

        service
            .log_warn(log_entry.message, log_entry.context)
            .unwrap();
    }

    #[rstest]
    fn log_error() {
        let log_id = 0u64;
        let log_entry = fixtures::log_entry_error();

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_append_log()
            .once()
            .with(eq(LogEntry {
                date_time: DateTime::new(get_date_time().unwrap()).unwrap(),
                ..log_entry.clone()
            }))
            .return_const(Ok(log_id));

        let service = LogServiceImpl::new(repository_mock);

        service
            .log_error(log_entry.message, log_entry.context)
            .unwrap();
    }
}
