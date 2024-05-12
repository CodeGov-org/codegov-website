use ic_cdk::query;
use ic_http_certification::{HttpRequest, HttpResponse};

use crate::{
    repositories::{CertificationRepositoryImpl, ImageRepositoryImpl, IMAGES_BASE_PATH},
    services::{HttpService, HttpServiceImpl, ImageService, ImageServiceImpl},
};

#[query]
fn http_request(req: HttpRequest) -> HttpResponse {
    HttpController::default().handle_http_request(req)
}

struct HttpController<I: ImageService, H: HttpService> {
    image_service: I,
    http_service: H,
}

impl Default
    for HttpController<
        ImageServiceImpl<ImageRepositoryImpl, CertificationRepositoryImpl>,
        HttpServiceImpl<CertificationRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(ImageServiceImpl::default(), HttpServiceImpl::default())
    }
}

impl<I: ImageService, H: HttpService> HttpController<I, H> {
    pub fn new(image_service: I, http_service: H) -> Self {
        Self {
            image_service,
            http_service,
        }
    }

    fn handle_http_request(&self, req: HttpRequest) -> HttpResponse {
        let req_path = req.get_path().expect("Missing path in request");

        if req_path.starts_with(IMAGES_BASE_PATH) {
            if req.method != "GET" {
                return self.image_service.http_response_405();
            }

            self.image_service
                .get_image_http_response(&req)
                .unwrap_or_else(|| self.http_service.http_response_404())
        } else {
            self.http_service.http_response_404()
        }
    }
}
