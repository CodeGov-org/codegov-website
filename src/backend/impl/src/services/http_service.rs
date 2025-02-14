use crate::{
    helpers::{response_404, NOT_FOUND_PATH},
    repositories::{CertificationRepository, CertificationRepositoryImpl},
};
use ic_http_certification::HttpResponse;

#[cfg_attr(test, mockall::automock)]
pub trait HttpService {
    fn http_response_404(&self, request_path: &str) -> HttpResponse<'static>;

    /// Certifies default responses, such as 404.
    ///
    /// Use this method during canister upgrades.
    fn certify_default_responses(&self);
}

pub struct HttpServiceImpl<C: CertificationRepository> {
    certification_repository: C,
}

impl Default for HttpServiceImpl<CertificationRepositoryImpl> {
    fn default() -> Self {
        Self::new(CertificationRepositoryImpl::default())
    }
}

impl<C: CertificationRepository> HttpService for HttpServiceImpl<C> {
    fn http_response_404(&self, request_path: &str) -> HttpResponse<'static> {
        self.certification_repository.get_certified_http_response(
            request_path,
            NOT_FOUND_PATH,
            response_404(),
        )
    }

    fn certify_default_responses(&self) {
        self.certification_repository
            .certify_http_response(NOT_FOUND_PATH, &response_404());
    }
}

impl<C: CertificationRepository> HttpServiceImpl<C> {
    pub fn new(certification_repository: C) -> Self {
        Self {
            certification_repository,
        }
    }
}
