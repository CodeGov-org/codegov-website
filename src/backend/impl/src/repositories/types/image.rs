use std::{borrow::Cow, path::PathBuf, str::FromStr};

use super::{DateTime, UserId, Uuid};
use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};

pub const IMAGES_BASE_PATH: &str = "/images/";
const ALLOWED_IMAGE_CONTENT_TYPES: &[&str] =
    &["image/png", "image/jpeg", "image/gif", "image/webp"];

pub type ImageId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct Image {
    pub created_at: DateTime,
    pub user_id: UserId,
    pub content_type: String,
    pub sub_path: Option<PathBuf>,
    pub content_bytes: Vec<u8>,
}

impl Storable for Image {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Image {
    /// Returns the path of the image in the form of `/images/<image_id>`
    /// or `/images/<sub_path>/<image_id>` if the `sub_path` field is set.
    pub fn path(&self, id: &ImageId) -> String {
        let mut path = PathBuf::from_str(IMAGES_BASE_PATH).unwrap();

        if let Some(sub_path) = &self.sub_path {
            path = path.join(sub_path);
        }

        let id = PathBuf::from(id.to_string());

        path.join(id).to_string_lossy().to_string()
    }
}

pub trait CreateImageRequest {
    fn content_type(&self) -> String;

    fn content_bytes(&self) -> Vec<u8>;

    fn validate_fields(&self) -> Result<(), ApiError> {
        let content_type = self.content_type();

        if content_type.is_empty() {
            return Err(ApiError::invalid_argument("Content type cannot be empty"));
        }

        if !ALLOWED_IMAGE_CONTENT_TYPES.contains(&content_type.as_str()) {
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures::{self, uuid_a, uuid_b};
    use rstest::*;

    #[rstest]
    #[case::image_with_path(fixtures::image_with_subpath())]
    #[case::image_without_path(fixtures::image_without_subpath())]
    fn image_storable_impl(#[case] image: Image) {
        let serialized_image = image.to_bytes();
        let deserialized_image = Image::from_bytes(serialized_image);

        assert_eq!(image, deserialized_image);
    }

    #[rstest]
    fn image_path() {
        for (id, image, expected_path) in images() {
            assert_eq!(image.path(&id), expected_path);
        }
    }

    #[fixture]
    fn images() -> Vec<(ImageId, Image, String)> {
        vec![
            (
                uuid_a(),
                Image {
                    sub_path: Some(PathBuf::from("logos")),
                    ..fixtures::image_without_subpath()
                },
                format!("{}logos/{}", IMAGES_BASE_PATH, uuid_a().to_string()),
            ),
            (
                uuid_a(),
                Image {
                    sub_path: Some(PathBuf::from("logos/")),
                    ..fixtures::image_without_subpath()
                },
                format!("{}logos/{}", IMAGES_BASE_PATH, uuid_a().to_string()),
            ),
            (
                uuid_a(),
                Image {
                    sub_path: Some(PathBuf::from("logos/subpath")),
                    ..fixtures::image_without_subpath()
                },
                format!("{}logos/subpath/{}", IMAGES_BASE_PATH, uuid_a().to_string()),
            ),
            (
                uuid_a(),
                Image {
                    sub_path: Some(PathBuf::from("")),
                    ..fixtures::image_without_subpath()
                },
                format!("{}{}", IMAGES_BASE_PATH, uuid_a().to_string()),
            ),
            (
                uuid_b(),
                fixtures::image_without_subpath(),
                format!("{}{}", IMAGES_BASE_PATH, uuid_b().to_string()),
            ),
        ]
    }

    struct TestCreateImageRequest {
        content_type: String,
        content_bytes: Vec<u8>,
    }

    impl TestCreateImageRequest {
        fn new(content_type: String, content_bytes: Vec<u8>) -> Self {
            Self {
                content_type,
                content_bytes,
            }
        }
    }

    impl CreateImageRequest for TestCreateImageRequest {
        fn content_type(&self) -> String {
            self.content_type.clone()
        }

        fn content_bytes(&self) -> Vec<u8> {
            self.content_bytes.clone()
        }
    }

    #[rstest]
    fn test_validate_fields() {
        let request = TestCreateImageRequest::new(
            "image/png".to_string(),
            fixtures::image_without_subpath().content_bytes,
        );

        assert!(request.validate_fields().is_ok());
    }

    #[rstest]
    #[case::content_type_empty(create_image_request_content_type_empty())]
    #[case::content_type_invalid(create_image_request_content_type_invalid())]
    #[case::content_bytes_empty(create_image_request_content_bytes_empty())]
    fn test_validate_fields_error(#[case] fixture: (TestCreateImageRequest, ApiError)) {
        let (request, expected_error) = fixture;
        assert_eq!(request.validate_fields().unwrap_err(), expected_error);
    }

    #[fixture]
    fn create_image_request_content_type_empty() -> (TestCreateImageRequest, ApiError) {
        (
            TestCreateImageRequest::new("".to_string(), vec![]),
            ApiError::invalid_argument("Content type cannot be empty"),
        )
    }

    #[fixture]
    fn create_image_request_content_type_invalid() -> (TestCreateImageRequest, ApiError) {
        (
            TestCreateImageRequest::new("image/invalid".to_string(), vec![]),
            ApiError::invalid_argument("Content type image/invalid not allowed"),
        )
    }

    #[fixture]
    fn create_image_request_content_bytes_empty() -> (TestCreateImageRequest, ApiError) {
        (
            TestCreateImageRequest::new("image/png".to_string(), vec![]),
            ApiError::invalid_argument("Image content cannot be empty"),
        )
    }
}
