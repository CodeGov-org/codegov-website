use std::time::{SystemTime, UNIX_EPOCH};

pub const FIVE_MINUTES_MS: u64 = 5 * 60 * 1_000;

pub fn now() -> SystemTime {
    SystemTime::now()
}

pub fn now_timestamp_ms() -> u64 {
    now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64
}
