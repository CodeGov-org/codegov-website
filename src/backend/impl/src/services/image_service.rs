use ic_http_certification::{HttpRequest, HttpResponse};

use crate::repositories::{ImageRepository, ImageRepositoryImpl};

#[cfg_attr(test, mockall::automock)]
pub trait ImageService {
    fn get_image_response(&self, req: &HttpRequest) -> HttpResponse;

    fn certify_all_images(&self);
}

pub struct ImageServiceImpl<I: ImageRepository> {
    image_repository: I,
}

impl Default for ImageServiceImpl<ImageRepositoryImpl> {
    fn default() -> Self {
        Self::new(ImageRepositoryImpl::default())
    }
}

impl<I: ImageRepository> ImageService for ImageServiceImpl<I> {
    fn get_image_response(&self, req: &HttpRequest) -> HttpResponse {
        self.image_repository.get_image_http_response(req)
    }

    fn certify_all_images(&self) {
        self.image_repository.certify_all_images()
    }
}

impl<I: ImageRepository> ImageServiceImpl<I> {
    fn new(image_repository: I) -> Self {
        Self { image_repository }
    }
}
