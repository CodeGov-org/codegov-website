use crate::{
    repositories::{CertificationRepositoryImpl, ImageRepositoryImpl, IMAGES_BASE_PATH},
    services::{
        AssetService, AssetServiceImpl, HttpService, HttpServiceImpl, ImageService,
        ImageServiceImpl,
    },
};
use ic_cdk::query;
use ic_http_certification::{HttpRequest, HttpResponse};

#[query]
fn http_request(req: HttpRequest) -> HttpResponse {
    HttpController::default().handle_http_request(&req)
}

struct HttpController<I: ImageService, H: HttpService, A: AssetService> {
    image_service: I,
    http_service: H,
    asset_service: A,
}

impl Default
    for HttpController<
        ImageServiceImpl<ImageRepositoryImpl, CertificationRepositoryImpl>,
        HttpServiceImpl<CertificationRepositoryImpl>,
        AssetServiceImpl<CertificationRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(
            ImageServiceImpl::default(),
            HttpServiceImpl::default(),
            AssetServiceImpl::default(),
        )
    }
}

impl<I: ImageService, H: HttpService, A: AssetService> HttpController<I, H, A> {
    pub fn new(image_service: I, http_service: H, asset_service: A) -> Self {
        Self {
            image_service,
            http_service,
            asset_service,
        }
    }

    fn handle_http_request(&self, req: &HttpRequest) -> HttpResponse<'static> {
        let req_path = req.get_path().expect("Missing path in request");

        if req_path.starts_with(IMAGES_BASE_PATH) {
            self.image_service
                .get_image_http_response(req)
                .unwrap_or_else(|| self.http_service.http_response_404(&req_path))
        } else {
            self.asset_service.serve_asset(req)
        }
    }
}
