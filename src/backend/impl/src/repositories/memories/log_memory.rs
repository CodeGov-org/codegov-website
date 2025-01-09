use super::{
    Memory, LOGS_INDEX_MEMORY_ID, LOGS_MEMORY_ID, LOGS_TIMESTAMP_LEVEL_INDEX_MEMORY_ID,
    MEMORY_MANAGER,
};
use crate::repositories::{LogEntry, LogId, LogTimestampKey};
use ic_stable_structures::{BTreeMap, Log};

pub type LogMemory = Log<LogEntry, Memory, Memory>;
pub type LogTimestampIndexMemory = BTreeMap<LogTimestampKey, LogId, Memory>;

pub fn init_logs() -> LogMemory {
    // TODO: handle the error
    LogMemory::init(get_logs_index_memory(), get_logs_memory()).unwrap()
}

pub fn init_log_timestamp_index() -> LogTimestampIndexMemory {
    LogTimestampIndexMemory::init(get_logs_timestamp_level_index_memory())
}

fn get_logs_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(LOGS_INDEX_MEMORY_ID))
}

fn get_logs_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(LOGS_MEMORY_ID))
}

fn get_logs_timestamp_level_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(LOGS_TIMESTAMP_LEVEL_INDEX_MEMORY_ID))
}
