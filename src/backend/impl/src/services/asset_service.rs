use crate::repositories::{CertificationRepository, CertificationRepositoryImpl};
use ic_asset_certification::{Asset, AssetConfig, AssetEncoding, AssetFallbackConfig};
use ic_http_certification::{HeaderField, HttpRequest, HttpResponse, StatusCode};
use include_dir::{include_dir, Dir};

static ASSETS_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../../frontend/dist/browser");
const IMMUTABLE_ASSET_CACHE_CONTROL: &str = "public, max-age=31536000, immutable";
const NO_CACHE_ASSET_CACHE_CONTROL: &str = "public, no-cache, no-store";

#[cfg_attr(test, mockall::automock)]
pub trait AssetService {
    fn serve_asset<'a>(&self, req: &HttpRequest<'a>) -> HttpResponse<'static>;

    fn certify_all_assets(&self);
}

pub struct AssetServiceImpl<C: CertificationRepository> {
    certification_repository: C,
}

impl Default for AssetServiceImpl<CertificationRepositoryImpl> {
    fn default() -> Self {
        Self::new(CertificationRepositoryImpl::default())
    }
}

impl<C: CertificationRepository> AssetService for AssetServiceImpl<C> {
    fn serve_asset<'a>(&self, req: &HttpRequest<'a>) -> HttpResponse<'static> {
        self.certification_repository.serve_asset(req)
    }

    fn certify_all_assets(&self) {
        let encodings = vec![
            AssetEncoding::Brotli.default_config(),
            AssetEncoding::Gzip.default_config(),
        ];

        let asset_configs = vec![
            AssetConfig::File {
                path: "index.html".to_string(),
                content_type: Some("text/html".to_string()),
                headers: Self::get_asset_headers(vec![(
                    "cache-control".to_string(),
                    NO_CACHE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                fallback_for: vec![AssetFallbackConfig {
                    scope: "/".to_string(),
                    status_code: Some(StatusCode::OK),
                }],
                aliased_by: vec!["/".to_string()],
                encodings: encodings.clone(),
            },
            AssetConfig::Pattern {
                pattern: "**/*.js".to_string(),
                content_type: Some("text/javascript".to_string()),
                headers: Self::get_asset_headers(vec![(
                    "cache-control".to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings: encodings.clone(),
            },
            AssetConfig::Pattern {
                pattern: "**/*.css".to_string(),
                content_type: Some("text/css".to_string()),
                headers: Self::get_asset_headers(vec![(
                    "cache-control".to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings,
            },
            AssetConfig::Pattern {
                pattern: "**/*.ico".to_string(),
                content_type: Some("image/x-icon".to_string()),
                headers: Self::get_asset_headers(vec![(
                    "cache-control".to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings: vec![],
            },
        ];

        let mut assets = Vec::new();
        Self::collect_assets(&ASSETS_DIR, &mut assets);

        self.certification_repository
            .certify_assets(assets, asset_configs);
    }
}

impl<C: CertificationRepository> AssetServiceImpl<C> {
    pub fn new(certification_repository: C) -> Self {
        Self {
            certification_repository,
        }
    }

    fn collect_assets<'content, 'path>(
        dir: &'content Dir<'path>,
        assets: &mut Vec<Asset<'content, 'path>>,
    ) {
        for file in dir.files() {
            assets.push(Asset::new(file.path().to_string_lossy(), file.contents()));
        }

        for dir in dir.dirs() {
            Self::collect_assets(dir, assets);
        }
    }

    fn get_asset_headers(additional_headers: Vec<HeaderField>) -> Vec<HeaderField> {
        let mut headers = vec![
            ("strict-transport-security".to_string(), "max-age=31536000; includeSubDomains".to_string()),
            ("x-frame-options".to_string(), "DENY".to_string()),
            ("x-content-type-options".to_string(), "nosniff".to_string()),
            ("content-security-policy".to_string(), "default-src 'self'; img-src 'self' data:; form-action 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content".to_string()),
            ("referrer-policy".to_string(), "no-referrer".to_string()),
            ("permissions-policy".to_string(), "accelerometer=(),ambient-light-sensor=(),autoplay=(),battery=(),camera=(),display-capture=(),document-domain=(),encrypted-media=(),fullscreen=(),gamepad=(),geolocation=(),gyroscope=(),layout-animations=(self),legacy-image-formats=(self),magnetometer=(),microphone=(),midi=(),oversized-images=(self),payment=(),picture-in-picture=(),publickey-credentials-get=(),speaker-selection=(),sync-xhr=(self),unoptimized-images=(self),unsized-media=(self),usb=(),screen-wake-lock=(),web-share=(),xr-spatial-tracking=()".to_string()),
            ("cross-origin-embedder-policy".to_string(), "require-corp".to_string()),
            ("cross-origin-opener-policy".to_string(), "same-origin".to_string()),
        ];
        headers.extend(additional_headers);

        headers
    }
}
