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

    fn content_bytes(&self) -> Vec<u8>;

    fn validate_fields(&self) -> Result<(), ApiError> {
        let content_type = self.content_type();
        if !ALLOWED_CONTENT_TYPES.contains(&content_type.as_str()) {
            return Err(ApiError::invalid_argument(&format!(
                "Content type {} not allowed",
                content_type
            )));
        }

        // We just check that the image is not empty, but this is not so robust
        // as one could upload a single pixel "image".
        //
        // TODO: implement a more robust validation on the minimum size of the image
        if self.content_bytes().is_empty() {
            return Err(ApiError::invalid_argument("Image content cannot be empty"));
        }

        // We don't have to check for the maximum size of the image
        // because the IC already limits the size of ingress messages to 2MB
        //
        // TODO: for this canister to be future proof, we should also check
        // that the image is not too large.

        Ok(())
    }
}
