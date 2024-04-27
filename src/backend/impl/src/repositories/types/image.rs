use std::{borrow::Cow, path::PathBuf, str::FromStr};

use super::{DateTime, UserId, Uuid};
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};

pub const IMAGES_BASE_PATH: &str = "/images/";

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
}
