use candid::{CandidType, Deserialize};

use crate::ApiError;

const ALLOWED_CONTENT_TYPES: &[&str] = &["image/png", "image/jpeg", "image/gif", "image/webp"];

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct Image {
    pub created_at: String,
    pub content_type: String,
    pub path: String,
    pub content_bytes: Vec<u8>,
}

pub trait CreateImageRequest {
    fn content_type(&self) -> String;

    fn validate_fields(&self) -> Result<(), ApiError> {
        let content_type = self.content_type();
        if !ALLOWED_CONTENT_TYPES.contains(&content_type.as_str()) {
            return Err(ApiError::invalid_argument(&format!(
                "Content type {} not allowed",
                content_type
            )));
        }

        Ok(())
    }
}
