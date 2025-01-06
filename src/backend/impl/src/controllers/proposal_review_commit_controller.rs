use backend_api::{
    ApiError, ApiResult, CreateProposalReviewCommitRequest, CreateProposalReviewCommitResponse,
    DeleteProposalReviewCommitRequest, UpdateProposalReviewCommitRequest,
};
use candid::Principal;
use ic_cdk::*;

use crate::{
    repositories::{
        ProposalRepositoryImpl, ProposalReviewCommitRepositoryImpl, ProposalReviewRepositoryImpl,
        UserProfileRepositoryImpl,
    },
    services::{
        AccessControlService, AccessControlServiceImpl, ProposalReviewCommitService,
        ProposalReviewCommitServiceImpl,
    },
};

#[update]
async fn create_proposal_review_commit(
    request: CreateProposalReviewCommitRequest,
) -> ApiResult<CreateProposalReviewCommitResponse> {
    let calling_principal = caller();

    ProposalReviewCommitController::default()
        .create_proposal_review_commit(calling_principal, request)
        .await
        .into()
}

#[update]
async fn update_proposal_review_commit(
    request: UpdateProposalReviewCommitRequest,
) -> ApiResult<()> {
    let calling_principal = caller();

    ProposalReviewCommitController::default()
        .update_proposal_review_commit(calling_principal, request)
        .into()
}

#[update]
async fn delete_proposal_review_commit(
    request: DeleteProposalReviewCommitRequest,
) -> ApiResult<()> {
    let calling_principal = caller();

    ProposalReviewCommitController::default()
        .delete_proposal_review_commit(calling_principal, request)
        .into()
}

struct ProposalReviewCommitController<A: AccessControlService, P: ProposalReviewCommitService> {
    access_control_service: A,
    proposal_review_commit_service: P,
}

impl Default
    for ProposalReviewCommitController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        ProposalReviewCommitServiceImpl<
            ProposalReviewCommitRepositoryImpl,
            UserProfileRepositoryImpl,
            ProposalReviewRepositoryImpl,
            ProposalRepositoryImpl,
        >,
    >
{
    fn default() -> Self {
        Self::new(
            AccessControlServiceImpl::default(),
            ProposalReviewCommitServiceImpl::default(),
        )
    }
}

impl<A: AccessControlService, P: ProposalReviewCommitService> ProposalReviewCommitController<A, P> {
    fn new(
        access_control_service: A,
        proposal_review_commit_service: P,
    ) -> ProposalReviewCommitController<A, P> {
        Self {
            access_control_service,
            proposal_review_commit_service,
        }
    }

    async fn create_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewCommitRequest,
    ) -> Result<CreateProposalReviewCommitResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        self.proposal_review_commit_service
            .create_proposal_review_commit(calling_principal, request)
            .await
    }

    fn update_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: UpdateProposalReviewCommitRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        self.proposal_review_commit_service
            .update_proposal_review_commit(calling_principal, request)
    }

    fn delete_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: DeleteProposalReviewCommitRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_reviewer(&calling_principal)?;

        self.proposal_review_commit_service
            .delete_proposal_review_commit(calling_principal, request)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        services::{MockAccessControlService, MockProposalReviewCommitService},
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    async fn create_proposal_review_commit() {
        let calling_principal = fixtures::principal_a();
        let request = CreateProposalReviewCommitRequest {
            proposal_review_id: "proposal_review_id".to_string(),
            commit_sha: "commit_sha".to_string(),
            state: backend_api::ReviewCommitState::Reviewed {
                matches_description: Some(true),
                comment: Some("comment".to_string()),
            },
        };
        let response = CreateProposalReviewCommitResponse {
            id: "id".to_string(),
            proposal_review_commit: fixtures::proposal_review_commit_reviewed().into(),
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockProposalReviewCommitService::new();
        service_mock
            .expect_create_proposal_review_commit()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(response.clone()));

        let controller =
            ProposalReviewCommitController::new(access_control_service_mock, service_mock);

        let result = controller
            .create_proposal_review_commit(calling_principal, request)
            .await
            .unwrap();

        assert_eq!(result, response);
    }

    #[rstest]
    async fn create_proposal_review_commit_unauthorized() {
        let calling_principal = fixtures::principal_a();
        let request = CreateProposalReviewCommitRequest {
            proposal_review_id: "proposal_review_id".to_string(),
            commit_sha: "commit_sha".to_string(),
            state: backend_api::ReviewCommitState::Reviewed {
                matches_description: Some(true),
                comment: Some("comment".to_string()),
            },
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

        let mut service_mock = MockProposalReviewCommitService::new();
        service_mock.expect_create_proposal_review_commit().never();

        let controller =
            ProposalReviewCommitController::new(access_control_service_mock, service_mock);

        let result = controller
            .create_proposal_review_commit(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(result, error);
    }

    #[rstest]
    fn update_proposal_review_commit() {
        let calling_principal = fixtures::principal_a();
        let request = UpdateProposalReviewCommitRequest {
            id: "id".to_string(),
            state: backend_api::ReviewCommitState::Reviewed {
                matches_description: Some(true),
                comment: Some("comment".to_string()),
            },
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockProposalReviewCommitService::new();
        service_mock
            .expect_update_proposal_review_commit()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(()));

        let controller =
            ProposalReviewCommitController::new(access_control_service_mock, service_mock);

        controller
            .update_proposal_review_commit(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    fn update_proposal_review_commit_unauthorized() {
        let calling_principal = fixtures::principal_a();
        let request = UpdateProposalReviewCommitRequest {
            id: "id".to_string(),
            state: backend_api::ReviewCommitState::Reviewed {
                matches_description: Some(true),
                comment: Some("comment".to_string()),
            },
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

        let mut service_mock = MockProposalReviewCommitService::new();
        service_mock.expect_update_proposal_review_commit().never();

        let controller =
            ProposalReviewCommitController::new(access_control_service_mock, service_mock);

        let result = controller
            .update_proposal_review_commit(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, error);
    }

    #[rstest]
    fn delete_proposal_review_commit() {
        let calling_principal = fixtures::principal_a();
        let request = DeleteProposalReviewCommitRequest {
            id: "id".to_string(),
        };

        let mut access_control_service_mock = MockAccessControlService::new();
        access_control_service_mock
            .expect_assert_principal_is_reviewer()
            .once()
            .with(eq(calling_principal))
            .return_const(Ok(()));

        let mut service_mock = MockProposalReviewCommitService::new();
        service_mock
            .expect_delete_proposal_review_commit()
            .once()
            .with(eq(calling_principal), eq(request.clone()))
            .return_const(Ok(()));

        let controller =
            ProposalReviewCommitController::new(access_control_service_mock, service_mock);

        controller
            .delete_proposal_review_commit(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    fn delete_proposal_review_commit_unauthorized() {
        let calling_principal = fixtures::principal_a();
        let request = DeleteProposalReviewCommitRequest {
            id: "id".to_string(),
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

        let mut service_mock = MockProposalReviewCommitService::new();
        service_mock.expect_delete_proposal_review_commit().never();

        let controller =
            ProposalReviewCommitController::new(access_control_service_mock, service_mock);

        let result = controller
            .delete_proposal_review_commit(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, error);
    }
}
