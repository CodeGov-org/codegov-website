use std::cell::RefCell;

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use ic_http_certification::{
    HttpCertification, HttpCertificationPath, HttpCertificationTree, HttpCertificationTreeEntry,
    HttpResponse,
};

use crate::helpers::{cbor_encode, IC_CERTIFICATE_HEADER, NOT_FOUND_PATH, RESPONSE_ONLY_CEL_EXPR};

#[cfg_attr(test, mockall::automock)]
pub trait CertificationRepository {
    fn certify_http_response(&self, request_path: &str, res: &HttpResponse<'static>);

    fn remove_http_response_certificate(&self, request_path: &str, res: &HttpResponse<'static>);

    fn get_certified_http_response(
        &self,
        request_path: &str,
        responding_tree_path: &str,
        res: HttpResponse<'static>,
    ) -> HttpResponse<'static>;
}

pub struct CertificationRepositoryImpl {}

impl Default for CertificationRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl CertificationRepository for CertificationRepositoryImpl {
    fn certify_http_response(&self, request_path: &str, res: &HttpResponse) {
        let res_tree_path = Self::response_tree_path(request_path);
        let entry = Self::response_entry(&res_tree_path, res);

        STATE.with_borrow_mut(|s| {
            s.http_tree.insert(&entry);
        });
        Self::set_certified_http_tree();
    }

    fn remove_http_response_certificate(&self, request_path: &str, res: &HttpResponse) {
        let res_tree_path = Self::response_tree_path(request_path);
        let entry = Self::response_entry(&res_tree_path, res);

        STATE.with_borrow_mut(|s| {
            s.http_tree.delete(&entry);
        });
        Self::set_certified_http_tree();
    }

    fn get_certified_http_response(
        &self,
        request_path: &str,
        responding_tree_path: &str,
        mut res: HttpResponse<'static>,
    ) -> HttpResponse<'static> {
        let res_tree_path = Self::response_tree_path(responding_tree_path);
        let entry = Self::response_entry(&res_tree_path, &res);

        Self::add_certificate_header(
            &mut res,
            &entry,
            request_path,
            &res_tree_path.to_expr_path(),
        );

        res
    }
}

impl CertificationRepositoryImpl {
    fn new() -> Self {
        Self {}
    }

    fn response_tree_path(request_path: &str) -> HttpCertificationPath {
        if request_path == NOT_FOUND_PATH {
            return HttpCertificationPath::wildcard(NOT_FOUND_PATH);
        }

        HttpCertificationPath::exact(request_path)
    }

    fn response_entry<'a>(
        res_tree_path: &'a HttpCertificationPath,
        res: &HttpResponse,
    ) -> HttpCertificationTreeEntry<'a> {
        let certification =
            HttpCertification::response_only(&RESPONSE_ONLY_CEL_EXPR, res, None).unwrap();

        HttpCertificationTreeEntry::new(res_tree_path, certification.to_owned())
    }

    fn add_certificate_header(
        response: &mut HttpResponse,
        entry: &HttpCertificationTreeEntry,
        request_url: &str,
        expr_path: &[String],
    ) {
        let certified_data = Self::certified_data();
        let witness = STATE.with_borrow(|s| {
            let witness = s.http_tree.witness(entry, request_url).unwrap();

            cbor_encode(&witness)
        });
        let expr_path = cbor_encode(&expr_path);

        response.headers_mut().push((
            IC_CERTIFICATE_HEADER.to_string(),
            format!(
                "certificate=:{}:, tree=:{}:, expr_path=:{}:, version=2",
                BASE64.encode(certified_data),
                BASE64.encode(witness),
                BASE64.encode(expr_path)
            ),
        ));
    }

    fn set_certified_http_tree() {
        #[cfg(not(test))]
        {
            STATE.with_borrow(|s| {
                ic_cdk::api::set_certified_data(&s.http_tree.root_hash());
            })
        }
    }

    fn certified_data() -> Vec<u8> {
        #[cfg(test)]
        {
            vec![]
        }

        #[cfg(not(test))]
        {
            ic_cdk::api::data_certificate().expect("No data certificate available")
        }
    }
}

#[derive(Default)]
struct CertificationRepositoryState {
    http_tree: HttpCertificationTree,
}

thread_local! {
    static STATE: RefCell<CertificationRepositoryState> = RefCell::new(CertificationRepositoryState::default());
}
