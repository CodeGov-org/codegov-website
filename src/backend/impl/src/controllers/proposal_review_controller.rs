use backend_api::{ApiError, ApiResult, CreateProposalReviewRequest, CreateProposalReviewResponse};
use candid::Principal;
use ic_cdk::*;

use crate::{
    repositories::{
        ProposalRepositoryImpl, ProposalReviewRepositoryImpl, UserProfileRepositoryImpl,
    },
    services::{
        AccessControlService, AccessControlServiceImpl, ProposalReviewService,
        ProposalReviewServiceImpl,
    },
};

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
            reproduced_build_image_id: None,
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

        let mut service_mock = MockProposalReviewService::new();
        let returned_response = response.clone();
        service_mock
            .expect_create_proposal_review()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(returned_response));

        let controller = ProposalReviewController::new(access_control_service_mock, service_mock);

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
            reproduced_build_image_id: None,
        };
        let error = ApiError::permission_denied(&format!(
            "Principal {} must be an admin to call this endpoint",
            &calling_principal.to_text()
        ));

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Err(error.clone()));

        let mut service_mock = MockProposalReviewService::new();
        service_mock.expect_create_proposal_review().never();

        let controller = ProposalReviewController::new(access_control_service_mock, service_mock);

        let result = controller
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(result, error);
    }
}
