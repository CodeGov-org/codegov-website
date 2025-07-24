use crate::helpers::{cbor_encode, IC_CERTIFICATE_HEADER, NOT_FOUND_PATH, RESPONSE_ONLY_CEL_EXPR};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use ic_asset_certification::{Asset, AssetConfig, AssetRouter};
use ic_http_certification::{
    HttpCertification, HttpCertificationPath, HttpCertificationTree, HttpCertificationTreeEntry,
    HttpRequest, HttpResponse,
};
use std::{cell::RefCell, rc::Rc};

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

    fn serve_asset<'a>(&self, req: &HttpRequest<'a>) -> HttpResponse<'static>;

    fn certify_assets<'path>(
        &self,
        assets: Vec<Asset<'static, 'path>>,
        asset_configs: Vec<AssetConfig>,
    );
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

        with_http_tree_mut(|http_tree| {
            http_tree.insert(&entry);
        });
        Self::set_certified_data();
    }

    fn remove_http_response_certificate(&self, request_path: &str, res: &HttpResponse) {
        let res_tree_path = Self::response_tree_path(request_path);
        let entry = Self::response_entry(&res_tree_path, res);

        with_http_tree_mut(|http_tree| {
            http_tree.delete(&entry);
        });
        Self::set_certified_data();
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

    fn serve_asset(&self, req: &HttpRequest) -> HttpResponse<'static> {
        with_asset_router(|asset_router| asset_router.serve_asset(&Self::certified_data(), req))
            .expect("Failed to serve static asset")
    }

    fn certify_assets<'path>(
        &self,
        assets: Vec<Asset<'static, 'path>>,
        asset_configs: Vec<AssetConfig>,
    ) {
        with_asset_router_mut(|asset_router| {
            asset_router
                .certify_assets(assets, asset_configs)
                .expect("Failed to certify assets")
        });
        Self::set_certified_data();
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
        let witness = with_http_tree(|http_tree| {
            let witness = http_tree.witness(entry, request_url).unwrap();

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

    fn set_certified_data() {
        #[cfg(not(test))]
        {
            with_http_tree(|http_tree| {
                ic_cdk::api::set_certified_data(&http_tree.root_hash());
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

fn with_http_tree<F, R>(f: F) -> R
where
    F: FnOnce(&HttpCertificationTree) -> R,
{
    HTTP_TREE.with(|tree| f(&tree.borrow()))
}

fn with_http_tree_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut HttpCertificationTree) -> R,
{
    HTTP_TREE.with(|tree| f(&mut tree.borrow_mut()))
}

fn with_asset_router<F, R>(f: F) -> R
where
    F: FnOnce(&AssetRouter<'static>) -> R,
{
    ASSET_ROUTER.with(|router| f(&router.borrow()))
}

fn with_asset_router_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut AssetRouter<'static>) -> R,
{
    ASSET_ROUTER.with(|router| f(&mut router.borrow_mut()))
}

thread_local! {
    static HTTP_TREE: Rc<RefCell<HttpCertificationTree>> = Default::default();
    static ASSET_ROUTER: RefCell<AssetRouter<'static>> = RefCell::new(AssetRouter::with_tree(HTTP_TREE.with(|tree| tree.clone())));
}
