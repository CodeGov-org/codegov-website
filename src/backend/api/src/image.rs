use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct Image {
    pub created_at: String,
    pub content_type: String,
    pub path: String,
    pub content_bytes: Vec<u8>,
}
