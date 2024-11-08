use crate::{
    repositories::{
        CertificationRepositoryImpl, ImageRepositoryImpl, ProposalRepositoryImpl,
        ProposalReviewCommitRepositoryImpl, ProposalReviewRepositoryImpl,
        UserProfileRepositoryImpl,
    },
    services::{
        AccessControlService, AccessControlServiceImpl, ProposalReviewService,
        ProposalReviewServiceImpl,
    },
};
use backend_api::{
    ApiError, ApiResult, CreateProposalReviewImageRequest, CreateProposalReviewImageResponse,
    CreateProposalReviewRequest, CreateProposalReviewResponse, DeleteProposalReviewImageRequest,
    GetMyProposalReviewRequest, GetMyProposalReviewResponse, GetMyProposalReviewSummaryRequest,
    GetMyProposalReviewSummaryResponse, GetProposalReviewRequest, GetProposalReviewResponse,
    ListProposalReviewsRequest, ListProposalReviewsResponse, UpdateProposalReviewRequest,
};
use candid::Principal;
use ic_cdk::*;

#[update]
async fn create_proposal_review(
    request: CreateProposalReviewRequest,
) -> ApiResult<CreateProposalReviewResponse> {
    let calling_principal = caller();

    ProposalReviewController::default()
        .create_proposal_review(calling_principal, request)
        .await
        .into()
}

#[update]
fn update_proposal_review(request: UpdateProposalReviewRequest) -> ApiResult<()> {
    let calling_principal = caller();

    ProposalReviewController::default()
        .update_proposal_review(calling_principal, request)
        .into()
}

#[query]
fn list_proposal_reviews(
    request: ListProposalReviewsRequest,
) -> ApiResult<ListProposalReviewsResponse> {
    let calling_principal = caller();

    ProposalReviewController::default()
        .list_proposal_reviews(calling_principal, request)
        .into()
}

#[query]
fn get_proposal_review(request: GetProposalReviewRequest) -> ApiResult<GetProposalReviewResponse> {
    let calling_principal = caller();

    ProposalReviewController::default()
        .get_proposal_review(calling_principal, request)
        .into()
}

#[update]
async fn create_proposal_review_image(
    request: CreateProposalReviewImageRequest,
) -> ApiResult<CreateProposalReviewImageResponse> {
    let calling_principal = caller();

    ProposalReviewController::default()
        .create_proposal_review_image(calling_principal, request)
        .await
        .into()
}

#[update]
fn delete_proposal_review_image(request: DeleteProposalReviewImageRequest) -> ApiResult<()> {
    let calling_principal = caller();

    ProposalReviewController::default()
        .delete_proposal_review_image(calling_principal, request)
        .into()
}

#[query]
fn get_my_proposal_review(
    request: GetMyProposalReviewRequest,
) -> ApiResult<GetMyProposalReviewResponse> {
    let calling_principal = caller();

    ProposalReviewController::default()
        .get_my_proposal_review(calling_principal, request)
        .into()
}

#[query]
fn get_my_proposal_review_summary(
    request: GetMyProposalReviewSummaryRequest,
) -> ApiResult<GetMyProposalReviewSummaryResponse> {
    let calling_principal = caller();

    ProposalReviewController::default()
        .get_my_proposal_review_summary(calling_principal, request)
        .into()
}

struct ProposalReviewController<A: AccessControlService, P: ProposalReviewService> {
    access_control_service: A,
    proposal_review_service: P,
}

impl Default
    for ProposalReviewController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        ProposalReviewServiceImpl<
            ProposalReviewRepositoryImpl,
            UserProfileRepositoryImpl,
            ProposalRepositoryImpl,
            ProposalReviewCommitRepositoryImpl,
            ImageRepositoryImpl,
            CertificationRepositoryImpl,
        >,
    >
{
    fn default() -> Self {
        Self::new(
            AccessControlServiceImpl::default(),
            ProposalReviewServiceImpl::default(),
        )
    }
}

impl<A: AccessControlService, P: ProposalReviewService> ProposalReviewController<A, P> {
    fn new(access_control_service: A, proposal_review_service: P) -> Self {
        Self {
            access_control_service,
            proposal_review_service,
        }
    }

    async fn create_proposal_review(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewRequest,
    ) -> Result<CreateProposalReviewResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        let proposal_review = self
            .proposal_review_service
            .create_proposal_review(calling_principal, request)
            .await?;

        Ok(proposal_review)
    }

    fn update_proposal_review(
        &self,
        calling_principal: Principal,
        request: UpdateProposalReviewRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        self.proposal_review_service
            .update_proposal_review(calling_principal, request)
    }

    fn list_proposal_reviews(
        &self,
        calling_principal: Principal,
        request: ListProposalReviewsRequest,
    ) -> Result<ListProposalReviewsResponse, ApiError> {
        self.proposal_review_service
            .list_proposal_reviews(calling_principal, request)
    }

    fn get_proposal_review(
        &self,
        calling_principal: Principal,
        request: GetProposalReviewRequest,
    ) -> Result<GetProposalReviewResponse, ApiError> {
        self.proposal_review_service
            .get_proposal_review(calling_principal, request)
    }

    async fn create_proposal_review_image(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewImageRequest,
    ) -> Result<CreateProposalReviewImageResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        self.proposal_review_service
            .create_proposal_review_image(calling_principal, request)
            .await
    }

    fn get_my_proposal_review(
        &self,
        calling_principal: Principal,
        request: GetMyProposalReviewRequest,
    ) -> Result<GetMyProposalReviewResponse, ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        self.proposal_review_service
            .get_my_proposal_review(calling_principal, request)
    }

    fn get_my_proposal_review_summary(
        &self,
        calling_principal: Principal,
        request: GetMyProposalReviewSummaryRequest,
    ) -> Result<GetMyProposalReviewSummaryResponse, ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        self.proposal_review_service
            .get_my_proposal_review_summary(calling_principal, request)
    }

    fn delete_proposal_review_image(
        &self,
        calling_principal: Principal,
        request: DeleteProposalReviewImageRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        self.proposal_review_service
            .delete_proposal_review_image(calling_principal, request)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        services::{MockAccessControlService, MockProposalReviewService},
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    async fn create_proposal_review() {
        let calling_principal = fixtures::principal();
        let request = CreateProposalReviewRequest {
            proposal_id: "proposal_id".to_string(),
            summary: Some("summary".to_string()),
            review_duration_mins: Some(10),
            build_reproduced: Some(true),
        };
        let response = CreateProposalReviewResponse {
            id: "id".to_string(),
            proposal_review: fixtures::proposal_review_draft().into(),
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut proposal_review_service_mock = MockProposalReviewService::new();
        let returned_response = response.clone();
        proposal_review_service_mock
            .expect_create_proposal_review()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(returned_response));

        let controller = ProposalReviewController::new(
            access_control_service_mock,
            proposal_review_service_mock,
        );

        let result = controller
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap();

        assert_eq!(result, response);
    }

    #[rstest]
    async fn create_proposal_review_unauthorized() {
        let calling_principal = fixtures::principal();
        let request = CreateProposalReviewRequest {
            proposal_id: "proposal_id".to_string(),
            summary: Some("summary".to_string()),
            review_duration_mins: Some(10),
            build_reproduced: Some(true),
        };
        let error = ApiError::permission_denied(&format!(
            "Principal {} must be a reviewer to call this endpoint",
            calling_principal.to_text()
        ));

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(error.clone()));

        let mut proposal_review_service_mock = MockProposalReviewService::new();
        proposal_review_service_mock
            .expect_create_proposal_review()
            .never();

        let controller = ProposalReviewController::new(
            access_control_service_mock,
            proposal_review_service_mock,
        );

        let result = controller
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(result, error);
    }

    #[rstest]
    fn update_proposal_review() {
        let calling_principal = fixtures::principal();
        let request = UpdateProposalReviewRequest {
            proposal_id: fixtures::proposal_id().to_string(),
            status: None,
            summary: Some("summary".to_string()),
            review_duration_mins: Some(10),
            build_reproduced: Some(true),
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut proposal_review_service_mock = MockProposalReviewService::new();
        proposal_review_service_mock
            .expect_update_proposal_review()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(()));

        let controller = ProposalReviewController::new(
            access_control_service_mock,
            proposal_review_service_mock,
        );

        controller
            .update_proposal_review(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    fn update_proposal_review_unauthorized() {
        let calling_principal = fixtures::principal();
        let request = UpdateProposalReviewRequest {
            proposal_id: fixtures::proposal_id().to_string(),
            status: None,
            summary: Some("summary".to_string()),
            review_duration_mins: Some(10),
            build_reproduced: Some(true),
        };
        let error = ApiError::permission_denied(&format!(
            "Principal {} must be a reviewer to call this endpoint",
            calling_principal.to_text()
        ));

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(error.clone()));

        let mut proposal_review_service_mock = MockProposalReviewService::new();
        proposal_review_service_mock
            .expect_create_proposal_review()
            .never();

        let controller = ProposalReviewController::new(
            access_control_service_mock,
            proposal_review_service_mock,
        );

        let result = controller
            .update_proposal_review(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, error);
    }

    #[rstest]
    async fn create_proposal_review_image() {
        let calling_principal = fixtures::principal();
        let request = CreateProposalReviewImageRequest {
            proposal_id: fixtures::proposal_id().to_string(),
            content_type: "image/png".to_string(),
            content_bytes: vec![1, 2, 3],
        };
        let response = CreateProposalReviewImageResponse {
            path: "/images/dummy-image-id".to_string(),
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut proposal_review_service_mock = MockProposalReviewService::new();
        proposal_review_service_mock
            .expect_create_proposal_review_image()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(response.clone()));

        let controller = ProposalReviewController::new(
            access_control_service_mock,
            proposal_review_service_mock,
        );

        let result = controller
            .create_proposal_review_image(calling_principal, request)
            .await
            .unwrap();

        assert_eq!(result, response);
    }

    #[rstest]
    async fn create_proposal_review_image_unauthorized() {
        let calling_principal = fixtures::principal();
        let request = CreateProposalReviewImageRequest {
            proposal_id: fixtures::proposal_id().to_string(),
            content_type: "image/png".to_string(),
            content_bytes: vec![1, 2, 3],
        };
        let error = ApiError::permission_denied(&format!(
            "Principal {} must be a reviewer to call this endpoint",
            calling_principal.to_text()
        ));

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(error.clone()));

        let mut proposal_review_service_mock = MockProposalReviewService::new();
        proposal_review_service_mock
            .expect_create_proposal_review_image()
            .never();

        let controller = ProposalReviewController::new(
            access_control_service_mock,
            proposal_review_service_mock,
        );

        let result = controller
            .create_proposal_review_image(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(result, error);
    }

    #[rstest]
    async fn delete_proposal_review_image() {
        let calling_principal = fixtures::principal();
        let request = DeleteProposalReviewImageRequest {
            proposal_id: fixtures::proposal_id().to_string(),
            image_path: "/images/reviews/dummy-image-id".to_string(),
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut proposal_review_service_mock = MockProposalReviewService::new();
        proposal_review_service_mock
            .expect_delete_proposal_review_image()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(()));

        let controller = ProposalReviewController::new(
            access_control_service_mock,
            proposal_review_service_mock,
        );

        controller
            .delete_proposal_review_image(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    async fn delete_proposal_review_image_unauthorized() {
        let calling_principal = fixtures::principal();
        let request = DeleteProposalReviewImageRequest {
            proposal_id: fixtures::proposal_id().to_string(),
            image_path: "/images/reviews/dummy-image-id".to_string(),
        };
        let error = ApiError::permission_denied(&format!(
            "Principal {} must be a reviewer to call this endpoint",
            calling_principal.to_text()
        ));

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(error.clone()));

        let mut proposal_review_service_mock = MockProposalReviewService::new();
        proposal_review_service_mock
            .expect_delete_proposal_review_image()
            .never();

        let controller = ProposalReviewController::new(
            access_control_service_mock,
            proposal_review_service_mock,
        );

        let result = controller
            .delete_proposal_review_image(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, error);
    }
}
