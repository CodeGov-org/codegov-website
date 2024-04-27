use ic_http_certification::HttpResponse;

pub fn response_404() -> HttpResponse {
    HttpResponse {
        status_code: 404,
        headers: vec![],
        body: "Not found".as_bytes().to_vec(),
        upgrade: None,
    }
}

pub fn response_405() -> HttpResponse {
    HttpResponse {
        status_code: 405,
        headers: vec![],
        body: "Method not allowed".as_bytes().to_vec(),
        upgrade: None,
    }
}
