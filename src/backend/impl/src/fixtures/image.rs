use std::path::PathBuf;

use rstest::*;

use crate::repositories::Image;

use super::{date_time_a, uuid_a};

const SAMPLE_IMAGE: &[u8] = include_bytes!("codegov-logo.png");

#[fixture]
pub fn image_with_subpath() -> Image {
    Image {
        created_at: date_time_a(),
        user_id: uuid_a(),
        content_type: "image/png".to_string(),
        sub_path: Some(PathBuf::from("logos")),
        content_bytes: SAMPLE_IMAGE.to_vec(),
    }
}

#[fixture]
pub fn image_without_subpath() -> Image {
    Image {
        created_at: date_time_a(),
        user_id: uuid_a(),
        content_type: "image/png".to_string(),
        sub_path: None,
        content_bytes: SAMPLE_IMAGE.to_vec(),
    }
}
