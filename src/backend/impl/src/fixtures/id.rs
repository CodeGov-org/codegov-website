use crate::repositories::{UserId, Uuid};
use candid::Principal;
use rstest::*;

#[fixture]
pub fn principal() -> Principal {
    Principal::from_slice(&[0])
}

#[fixture]
pub fn uuid() -> Uuid {
    Uuid::from_random_bytes([0; 16])
}

#[fixture]
pub fn user_id() -> UserId {
    uuid()
}
