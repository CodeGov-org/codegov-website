use ic_http_certification::HttpResponse;

use super::{IC_CERTIFICATE_EXPRESSION_HEADER, RESPONSE_ONLY_CEL_EXPR};

pub const NOT_FOUND_PATH: &str = "";

pub fn response_404() -> HttpResponse<'static> {
    HttpResponse::not_found(
        b"Not found",
        vec![
            ("Content-Type".to_string(), "text/plain".to_string()),
            (
                IC_CERTIFICATE_EXPRESSION_HEADER.to_string(),
                RESPONSE_ONLY_CEL_EXPR.to_string(),
            ),
        ],
    )
    .build()
}
