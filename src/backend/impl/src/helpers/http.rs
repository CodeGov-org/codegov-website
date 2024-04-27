use ic_http_certification::HttpResponse;

pub fn response_404() -> HttpResponse {
    HttpResponse {
        status_code: 404,
        headers: vec![],
        body: "Not found".as_bytes().to_vec(),
        upgrade: None,
    }
}
