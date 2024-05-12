use ic_http_certification::HttpResponse;

use super::{IC_CERTIFICATE_EXPRESSION_HEADER, RESPONSE_ONLY_CEL_EXPR};

pub const NOT_FOUND_PATH: &str = "";

pub fn response_404() -> HttpResponse {
    HttpResponse {
        status_code: 404,
        headers: vec![
            ("Content-Type".to_string(), "text/plain".to_string()),
            (
                IC_CERTIFICATE_EXPRESSION_HEADER.to_string(),
                RESPONSE_ONLY_CEL_EXPR.to_string(),
            ),
        ],
        body: "Not found".as_bytes().to_vec(),
        upgrade: None,
    }
}

pub fn response_405() -> HttpResponse {
    HttpResponse {
        status_code: 405,
        headers: vec![
            ("Content-Type".to_string(), "text/plain".to_string()),
            (
                IC_CERTIFICATE_EXPRESSION_HEADER.to_string(),
                RESPONSE_ONLY_CEL_EXPR.to_string(),
            ),
        ],
        body: "Method not allowed".as_bytes().to_vec(),
        upgrade: None,
    }
}
