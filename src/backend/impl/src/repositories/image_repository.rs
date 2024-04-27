use std::cell::RefCell;

use backend_api::ApiError;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use ic_http_certification::{
    DefaultCelBuilder, DefaultResponseCertification, DefaultResponseOnlyCelExpression,
    HttpCertification, HttpCertificationPath, HttpCertificationTree, HttpCertificationTreeEntry,
    HttpRequest, HttpResponse,
};
use lazy_static::lazy_static;

use crate::helpers::{cbor_encode, response_404};

use super::{init_images, Image, ImageId, ImageMemory};

const IC_CERTIFICATE_HEADER: &str = "IC-Certificate";
const IC_CERTIFICATE_EXPRESSION_HEADER: &str = "IC-CertificateExpression";

lazy_static! {
    static ref CEL_EXPR: DefaultResponseOnlyCelExpression<'static> =
        DefaultCelBuilder::response_only_certification()
            .with_response_certification(DefaultResponseCertification::response_header_exclusions(
                vec![],
            ))
            .build();
}

#[cfg_attr(test, mockall::automock)]
pub trait ImageRepository {
    fn get_image_by_id(&self, image_id: &ImageId) -> Option<Image>;

    /// Returns the image HTTP response for the given image path with its certification.
    /// If the image does not exist, returns a 404 response (not certified).
    fn get_image_http_response(&self, req: &HttpRequest) -> HttpResponse;

    /// Stores the new image in the stable memory and certifies
    /// its HTTP response at the given image path.
    async fn create_image(&self, image: Image) -> Result<ImageId, ApiError>;

    /// Deletes the image from the stable memory and removes the associated HTTP response.
    fn delete_image(&self, image_id: &ImageId) -> Result<(), ApiError>;

    /// Certifies all images responses.
    ///
    /// Use this method during canister upgrades.
    fn certify_all_images(&self);
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

    fn get_image_http_response(&self, req: &HttpRequest) -> HttpResponse {
        let req_path = req.get_path().expect("Missing path in request");

        let Some(image_id) = req_path
            .split('/')
            .last()
            .and_then(|s| ImageId::try_from(s).ok())
        else {
            return response_404();
        };

        let Some(image) = self.get_image_by_id(&image_id) else {
            return response_404();
        };

        Self::image_certified_http_response(&image_id, &image)
    }

    async fn create_image(&self, image: Image) -> Result<ImageId, ApiError> {
        let image_id = ImageId::new().await?;

        STATE.with_borrow_mut(|s| {
            s.images.insert(image_id, image.clone());
        });

        Self::certify_image_http_response(&image_id, &image);

        Ok(image_id)
    }

    fn delete_image(&self, image_id: &ImageId) -> Result<(), ApiError> {
        let image = self
            .get_image_by_id(&image_id)
            .ok_or(ApiError::not_found(&format!(
                "Image with id {} not found",
                image_id.to_string()
            )))?;

        STATE.with_borrow_mut(|s| {
            s.images.remove(image_id);
        });

        Self::remove_image_http_response_certification(&image_id, &image);

        Ok(())
    }

    fn certify_all_images(&self) {
        let images: Vec<_> = STATE.with_borrow(|s| s.images.range(ImageId::min()..).collect());

        for image in images.iter() {
            Self::certify_image_http_response(&image.0, &image.1);
        }
    }
}

impl ImageRepositoryImpl {
    fn new() -> Self {
        Self {}
    }

    fn certify_image_http_response(image_id: &ImageId, image: &Image) {
        let (_, image_tree_path) = Self::image_paths(image_id, image);
        let response = Self::create_image_http_response(image);
        let entry = Self::image_certification_entry(&response, &image_tree_path);

        HTTP_TREE.with_borrow_mut(|http_tree| {
            http_tree.insert(&entry);

            #[cfg(not(test))]
            ic_cdk::api::set_certified_data(&http_tree.root_hash());
        });
    }

    fn image_certified_http_response(image_id: &ImageId, image: &Image) -> HttpResponse {
        let (image_path, image_tree_path) = Self::image_paths(image_id, image);
        let mut response = Self::create_image_http_response(image);
        let entry = Self::image_certification_entry(&response, &image_tree_path);

        Self::add_certificate_header(
            &mut response,
            &entry,
            &image_path,
            &image_tree_path.to_expr_path(),
        );

        response
    }

    fn remove_image_http_response_certification(image_id: &ImageId, image: &Image) {
        let (_, image_tree_path) = Self::image_paths(image_id, image);
        let response = Self::create_image_http_response(image);
        let entry = Self::image_certification_entry(&response, &image_tree_path);

        HTTP_TREE.with_borrow_mut(|http_tree| {
            http_tree.delete(&entry);

            #[cfg(not(test))]
            ic_cdk::api::set_certified_data(&http_tree.root_hash());
        });
    }

    fn image_paths<'a>(image_id: &ImageId, image: &Image) -> (String, HttpCertificationPath<'a>) {
        let image_path = image.path(image_id);
        (image_path.clone(), HttpCertificationPath::exact(image_path))
    }

    fn create_image_http_response(image: &Image) -> HttpResponse {
        let body = &image.content_bytes;
        let headers = vec![
            ("strict-transport-security".to_string(), "max-age=31536000; includeSubDomains".to_string()),
            ("x-frame-options".to_string(), "DENY".to_string()),
            ("x-content-type-options".to_string(), "nosniff".to_string()),
            ("content-security-policy".to_string(), "default-src 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content".to_string()),
            ("referrer-policy".to_string(), "no-referrer".to_string()),
            ("permissions-policy".to_string(), "accelerometer=(),ambient-light-sensor=(),autoplay=(),battery=(),camera=(),display-capture=(),document-domain=(),encrypted-media=(),fullscreen=(),gamepad=(),geolocation=(),gyroscope=(),layout-animations=(self),legacy-image-formats=(self),magnetometer=(),microphone=(),midi=(),oversized-images=(self),payment=(),picture-in-picture=(),publickey-credentials-get=(),speaker-selection=(),sync-xhr=(self),unoptimized-images=(self),unsized-media=(self),usb=(),screen-wake-lock=(),web-share=(),xr-spatial-tracking=()".to_string()),
            ("cross-origin-embedder-policy".to_string(), "require-corp".to_string()),
            ("cross-origin-opener-policy".to_string(), "same-origin".to_string()),
            (
                "cache-control".to_string(),
                "public, max-age=31536000, immutable".to_string(),
            ),
            (IC_CERTIFICATE_EXPRESSION_HEADER.to_string(), CEL_EXPR.to_string()),
            // additional image-specific headers
            ("content-length".to_string(), body.len().to_string()),
            ("content-type".to_string(), image.content_type.clone()),
        ];

        HttpResponse {
            status_code: 200,
            headers,
            body: body.to_vec(),
            upgrade: None,
        }
    }

    fn image_certification_entry<'a>(
        response: &HttpResponse,
        image_tree_path: &'a HttpCertificationPath,
    ) -> HttpCertificationTreeEntry<'a> {
        let certificate = HttpCertification::response_only(&CEL_EXPR, &response, None).unwrap();

        HttpCertificationTreeEntry::new(image_tree_path, certificate.to_owned())
    }

    fn add_certificate_header(
        response: &mut HttpResponse,
        entry: &HttpCertificationTreeEntry,
        request_url: &str,
        expr_path: &[String],
    ) {
        let certified_data = {
            #[cfg(test)]
            {
                vec![]
            }

            #[cfg(not(test))]
            {
                ic_cdk::api::data_certificate().expect("No data certificate available")
            }
        };
        let witness = HTTP_TREE.with_borrow(|http_tree| {
            let witness = http_tree.witness(entry, request_url).unwrap();

            cbor_encode(&witness)
        });
        let expr_path = cbor_encode(&expr_path);

        response.headers.push((
            IC_CERTIFICATE_HEADER.to_string(),
            format!(
                "certificate=:{}:, tree=:{}:, expr_path=:{}:, version=2",
                BASE64.encode(certified_data),
                BASE64.encode(witness),
                BASE64.encode(expr_path)
            ),
        ));
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
    static HTTP_TREE: RefCell<HttpCertificationTree> = RefCell::new(HttpCertificationTree::default());
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
    async fn create_and_get_image_by_id(#[case] image: Image) {
        STATE.set(ImageRepositoryState::default());
        HTTP_TREE.set(HttpCertificationTree::default());

        let repository = ImageRepositoryImpl::default();
        let image_id = repository.create_image(image.clone()).await.unwrap();

        let result = repository.get_image_by_id(&image_id);

        assert_eq!(result, Some(image));
    }

    #[rstest]
    #[case::image_with_subpath(fixtures::image_with_subpath())]
    #[case::image_without_subpath(fixtures::image_without_subpath())]
    async fn create_and_get_image_http_response(#[case] image: Image) {
        STATE.set(ImageRepositoryState::default());
        HTTP_TREE.set(HttpCertificationTree::default());

        let repository = ImageRepositoryImpl::default();
        let image_id = repository.create_image(image.clone()).await.unwrap();

        let request = HttpRequest {
            headers: vec![],
            method: "GET".to_string(),
            url: image.path(&image_id),
            body: vec![],
        };

        let response = repository.get_image_http_response(&request);

        assert_eq!(response.status_code, 200);
        assert_eq!(response.body, image.content_bytes);
        assert!(response
            .headers
            .contains(&("content-type".to_string(), image.content_type)));
        assert!(response.headers.contains(&(
            "content-length".to_string(),
            image.content_bytes.len().to_string()
        )));
    }

    #[rstest]
    async fn delete_image() {
        STATE.set(ImageRepositoryState::default());
        HTTP_TREE.set(HttpCertificationTree::default());

        let original_image = fixtures::image_with_subpath();

        let repository = ImageRepositoryImpl::default();
        let image_id = repository
            .create_image(original_image.clone())
            .await
            .unwrap();

        repository.delete_image(&image_id).unwrap();

        let result = repository.get_image_by_id(&image_id);
        assert!(result.is_none());

        // try to delete the same image again to hit the error
        let result = repository.delete_image(&image_id).unwrap_err();
        assert_eq!(
            result,
            ApiError::not_found(&format!("Image with id {} not found", image_id.to_string()))
        );
    }

    #[rstest]
    async fn certify_all_images() {
        STATE.set(ImageRepositoryState::default());
        HTTP_TREE.set(HttpCertificationTree::default());

        let repository = ImageRepositoryImpl::default();
        let mut expected_images = BTreeMap::new();

        for _ in 0..10 {
            let image = fixtures::image_with_subpath();

            let image_id = repository.create_image(image.clone()).await.unwrap();

            let request = HttpRequest {
                headers: vec![],
                method: "GET".to_string(),
                url: image.path(&image_id),
                body: vec![],
            };
            expected_images.insert(image_id, (image, request));
        }

        repository.certify_all_images();

        for (image, request) in expected_images.values() {
            let response = repository.get_image_http_response(&request);

            assert_eq!(response.status_code, 200);
            assert_eq!(response.body, image.content_bytes);
            assert!(response
                .headers
                .contains(&("content-type".to_string(), image.content_type.clone())));
            assert!(response.headers.contains(&(
                "content-length".to_string(),
                image.content_bytes.len().to_string()
            )));
        }
    }
}
