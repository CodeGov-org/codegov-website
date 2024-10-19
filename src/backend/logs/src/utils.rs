use std::time::{SystemTime, UNIX_EPOCH};

pub fn now() -> SystemTime {
    SystemTime::now()
}

pub fn now_timestamp_ms() -> u64 {
    now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64
}
