use ic_http_certification::{HttpRequest, HttpResponse};

use crate::{
    helpers::create_image_http_response,
    repositories::{
        CertificationRepository, CertificationRepositoryImpl, ImageId, ImageRepository,
        ImageRepositoryImpl,
    },
};

#[cfg_attr(test, mockall::automock)]
pub trait ImageService {
    fn get_image_http_response<'a>(
        &self,
        req: &'a HttpRequest<'a>,
    ) -> Option<HttpResponse<'static>>;

    /// Certifies all images responses.
    ///
    /// Use this method during canister upgrades.
    fn certify_all_http_responses(&self);
}

pub struct ImageServiceImpl<I: ImageRepository, C: CertificationRepository> {
    image_repository: I,
    certification_repository: C,
}

impl Default for ImageServiceImpl<ImageRepositoryImpl, CertificationRepositoryImpl> {
    fn default() -> Self {
        Self::new(
            ImageRepositoryImpl::default(),
            CertificationRepositoryImpl::default(),
        )
    }
}

impl<I: ImageRepository, C: CertificationRepository> ImageService for ImageServiceImpl<I, C> {
    fn get_image_http_response(&self, req: &HttpRequest) -> Option<HttpResponse<'static>> {
        let req_path = req.get_path().expect("Missing path in request");

        let image_id = req_path
            .split('/')
            .last()
            .and_then(|s| ImageId::try_from(s).ok())?;

        let image = self.image_repository.get_image_by_id(&image_id)?;
        let image_http_response = create_image_http_response(image);

        let certified_response = self.certification_repository.get_certified_http_response(
            &req_path,
            &req_path,
            image_http_response.clone(),
        );

        Some(certified_response)
    }

    fn certify_all_http_responses(&self) {
        for (image_id, image) in self.image_repository.get_all_images() {
            let image_path = image.path(&image_id);
            let image_http_response = create_image_http_response(image);
            self.certification_repository
                .certify_http_response(&image_path, &image_http_response);
        }
    }
}

impl<I: ImageRepository, C: CertificationRepository> ImageServiceImpl<I, C> {
    fn new(image_repository: I, certification_repository: C) -> Self {
        Self {
            image_repository,
            certification_repository,
        }
    }
}
