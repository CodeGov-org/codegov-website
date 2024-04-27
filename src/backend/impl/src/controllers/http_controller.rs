use ic_cdk::query;
use ic_http_certification::{HttpRequest, HttpResponse};

use crate::{
    helpers::response_404,
    repositories::{ImageRepositoryImpl, IMAGES_BASE_PATH},
    services::{ImageService, ImageServiceImpl},
};

#[query]
fn http_request(req: HttpRequest) -> HttpResponse {
    HttpController::default().handle_http_request(req)
}

struct HttpController<I: ImageService> {
    image_service: I,
}

impl Default for HttpController<ImageServiceImpl<ImageRepositoryImpl>> {
    fn default() -> Self {
        Self::new(ImageServiceImpl::default())
    }
}

impl<I: ImageService> HttpController<I> {
    pub fn new(image_service: I) -> Self {
        Self { image_service }
    }

    fn handle_http_request(&self, req: HttpRequest) -> HttpResponse {
        let req_path = req.get_path().expect("Missing path in request");

        if req_path.starts_with(IMAGES_BASE_PATH) {
            self.image_service.get_image_response(&req)
        } else {
            response_404()
        }
    }
}
