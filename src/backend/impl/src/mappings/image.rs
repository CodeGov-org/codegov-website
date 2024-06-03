use crate::repositories::CreateImageRequest;

impl CreateImageRequest for backend_api::CreateProposalReviewImageRequest {
    fn content_type(&self) -> String {
        self.content_type.clone()
    }

    fn content_bytes(&self) -> Vec<u8> {
        self.content_bytes.clone()
    }
}
