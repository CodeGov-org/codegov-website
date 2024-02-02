use crate::{
    mappings::{map_get_logs_response, map_logs_filter_request},
    repositories::{DateTime, LogEntry, LogRepository, LogRepositoryImpl},
    system_api::get_date_time,
};
use backend_api::{ApiError, GetLogsResponse, LogsFilterRequest};

#[cfg_attr(test, mockall::automock)]
pub trait LogService {
    fn get_logs(&self, filter: LogsFilterRequest) -> GetLogsResponse;

    fn append_log(&self, message: String, context: Option<String>) -> Result<(), ApiError>;
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
    fn get_logs(&self, request: LogsFilterRequest) -> GetLogsResponse {
        let filter = map_logs_filter_request(request);

        let logs = self
            .log_repository
            .get_logs()
            .iter()
            .filter(|l| filter.matches(l))
            .cloned()
            .collect::<Vec<_>>();

        map_get_logs_response(logs)
    }

    fn append_log(&self, message: String, context: Option<String>) -> Result<(), ApiError> {
        let date_time = get_date_time()?;

        let log_entry = LogEntry {
            date_time: DateTime::new(date_time)?,
            context,
            message,
        };

        self.log_repository.append_log(log_entry).map(|_| ())
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
    use rstest::*;

    #[rstest]
    fn get_logs_empty_filter() {
        let (log_entry, filter, _) = fixtures::filters::empty_filter();

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_get_logs()
            .once()
            .return_const(vec![log_entry.clone(), log_entry.clone()]);

        let service = LogServiceImpl::new(repository_mock);

        let result = service.get_logs(filter.into());

        assert_eq!(
            result,
            map_get_logs_response(vec![log_entry.clone(), log_entry])
        );
    }

    #[rstest]
    #[case::before_filter_matching(fixtures::filters::before_filter_matching())]
    #[case::before_filter_not_matching(fixtures::filters::before_filter_not_matching())]
    #[case::after_filter_matching(fixtures::filters::after_filter_matching())]
    #[case::after_filter_not_matching(fixtures::filters::after_filter_not_matching())]
    #[case::time_range_filter_matching(fixtures::filters::time_range_filter_matching())]
    #[case::time_range_filter_not_matching(fixtures::filters::time_range_filter_not_matching())]
    #[case::context_filter_matching(fixtures::filters::context_filter_matching())]
    #[case::context_filter_not_matching(fixtures::filters::context_filter_not_matching())]
    #[case::message_filter_matching(fixtures::filters::message_filter_matching())]
    #[case::message_filter_not_matchingd(fixtures::filters::message_filter_not_matching())]
    #[case::all_matching(fixtures::filters::all_matching())]
    #[case::all_not_matching(fixtures::filters::all_not_matching())]
    fn get_logs(#[case] fixture: (LogEntry, LogsFilter, bool)) {
        let (log_entry, filter, expected) = fixture;

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_get_logs()
            .once()
            .return_const(vec![log_entry.clone()]);

        let service = LogServiceImpl::new(repository_mock);

        let result = service.get_logs(filter.into());

        assert_eq!(
            result,
            if expected {
                map_get_logs_response(vec![log_entry])
            } else {
                vec![]
            }
        );
    }

    #[rstest]
    fn append_log() {
        let log_id = 0u64;

        let mut repository_mock = MockLogRepository::new();
        repository_mock
            .expect_append_log()
            .once()
            .return_const(Ok(log_id));

        let service = LogServiceImpl::new(repository_mock);

        service
            .append_log("foo".to_string(), Some("my_function".to_string()))
            .unwrap();
    }
}
