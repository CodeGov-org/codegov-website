use ic_http_certification::HttpResponse;

use crate::repositories::Image;

use super::{IC_CERTIFICATE_EXPRESSION_HEADER, RESPONSE_ONLY_CEL_EXPR};

pub fn create_image_http_response(image: &Image) -> HttpResponse {
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
            (IC_CERTIFICATE_EXPRESSION_HEADER.to_string(), RESPONSE_ONLY_CEL_EXPR.to_string()),
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
