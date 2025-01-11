use std::cell::RefCell;

use backend_api::ApiError;

use super::{init_images, Image, ImageId, ImageMemory};

#[cfg_attr(test, mockall::automock)]
pub trait ImageRepository {
    fn get_image_by_id(&self, image_id: &ImageId) -> Option<Image>;

    fn get_all_images(&self) -> Vec<(ImageId, Image)>;

    fn create_image(&self, image: Image) -> ImageId;

    fn delete_image(&self, image_id: &ImageId) -> Result<Image, ApiError>;
}

pub struct ImageRepositoryImpl {}

impl Default for ImageRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl ImageRepository for ImageRepositoryImpl {
    fn get_image_by_id(&self, image_id: &ImageId) -> Option<Image> {
        STATE.with_borrow(|s| s.images.get(image_id))
    }

    fn get_all_images(&self) -> Vec<(ImageId, Image)> {
        STATE.with_borrow(|s| s.images.range(ImageId::min()..).collect())
    }

    fn create_image(&self, image: Image) -> ImageId {
        let image_id = ImageId::new();

        STATE.with_borrow_mut(|s| {
            s.images.insert(image_id, image.clone());
        });

        image_id
    }

    fn delete_image(&self, image_id: &ImageId) -> Result<Image, ApiError> {
        STATE
            .with_borrow_mut(|s| s.images.remove(image_id))
            .ok_or(ApiError::not_found(&format!(
                "Image with id {} not found",
                image_id
            )))
    }
}

impl ImageRepositoryImpl {
    fn new() -> Self {
        Self {}
    }
}

struct ImageRepositoryState {
    images: ImageMemory,
}

impl Default for ImageRepositoryState {
    fn default() -> Self {
        Self {
            images: init_images(),
        }
    }
}

thread_local! {
    static STATE: RefCell<ImageRepositoryState> = RefCell::new(ImageRepositoryState::default());
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use crate::fixtures;

    use super::*;
    use rstest::*;

    #[rstest]
    #[case::image_with_subpath(fixtures::image_with_subpath())]
    #[case::image_without_subpath(fixtures::image_without_subpath())]
    fn create_and_get_image_by_id(#[case] image: Image) {
        STATE.set(ImageRepositoryState::default());

        let repository = ImageRepositoryImpl::default();
        let image_id = repository.create_image(image.clone());

        let result = repository.get_image_by_id(&image_id);

        assert_eq!(result, Some(image));
    }

    #[rstest]
    fn delete_image() {
        STATE.set(ImageRepositoryState::default());

        let original_image = fixtures::image_with_subpath();

        let repository = ImageRepositoryImpl::default();
        let image_id = repository.create_image(original_image.clone());

        let deleted_image = repository.delete_image(&image_id).unwrap();

        assert_eq!(deleted_image, original_image);

        let result = repository.get_image_by_id(&image_id);
        assert!(result.is_none());

        // try to delete the same image again to hit the error
        let result = repository.delete_image(&image_id).unwrap_err();
        assert_eq!(
            result,
            ApiError::not_found(&format!("Image with id {} not found", image_id))
        );
    }

    #[rstest]
    fn get_all_images() {
        STATE.set(ImageRepositoryState::default());

        let repository = ImageRepositoryImpl::default();
        let mut expected_images = BTreeMap::new();

        for _ in 0..10 {
            let image = fixtures::image_with_subpath();

            let image_id = repository.create_image(image.clone());

            expected_images.insert(image_id, image);
        }

        let images = repository.get_all_images();

        assert_eq!(images.len(), expected_images.len());

        for image in expected_images.values() {
            assert_eq!(
                images
                    .iter()
                    .find_map(|i| {
                        if i.1 == *image {
                            Some(i.1.clone())
                        } else {
                            None
                        }
                    })
                    .unwrap(),
                image.to_owned()
            );
        }
    }
}
