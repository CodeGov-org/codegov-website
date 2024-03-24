use backend_api::{ApiError, CreateProposalReviewRequest, CreateProposalReviewResponse};
use candid::Principal;

use crate::{
    mappings::map_create_proposal_review_response,
    repositories::{
        DateTime, ProposalRepository, ProposalRepositoryImpl, ProposalReview,
        ProposalReviewRepository, ProposalReviewRepositoryImpl, ProposalReviewStatus,
        UserProfileRepository, UserProfileRepositoryImpl, Uuid,
    },
    system_api::get_date_time,
};

const MAX_PROPOSAL_REVIEW_SUMMARY_CHARS: usize = 1500;
const MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS: u16 = 60 * 3; // 3 hours

#[cfg_attr(test, mockall::automock)]
pub trait ProposalReviewService {
    async fn create_proposal_review(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewRequest,
    ) -> Result<CreateProposalReviewResponse, ApiError>;
}

pub struct ProposalReviewServiceImpl<
    PR: ProposalReviewRepository,
    U: UserProfileRepository,
    P: ProposalRepository,
> {
    proposal_review_repository: PR,
    user_profile_repository: U,
    proposal_repository: P,
}

impl Default
    for ProposalReviewServiceImpl<
        ProposalReviewRepositoryImpl,
        UserProfileRepositoryImpl,
        ProposalRepositoryImpl,
    >
{
    fn default() -> Self {
        Self::new(
            ProposalReviewRepositoryImpl::default(),
            UserProfileRepositoryImpl::default(),
            ProposalRepositoryImpl::default(),
        )
    }
}

impl<PR: ProposalReviewRepository, U: UserProfileRepository, P: ProposalRepository>
    ProposalReviewService for ProposalReviewServiceImpl<PR, U, P>
{
    async fn create_proposal_review(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewRequest,
    ) -> Result<CreateProposalReviewResponse, ApiError> {
        self.validate_request(&request.summary, request.review_duration_mins)?;

        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let proposal_id = Uuid::try_from(request.proposal_id.as_str())?;

        match self.proposal_repository.get_proposal_by_id(&proposal_id) {
            Some(proposal) => {
                if proposal.is_completed() {
                    return Err(ApiError::conflict(&format!(
                        "Proposal with Id {} is already completed",
                        proposal_id.to_string()
                    )));
                }
            }
            None => {
                return Err(ApiError::not_found(&format!(
                    "Proposal with Id {} not found",
                    request.proposal_id
                )))
            }
        }

        let date_time = get_date_time()?;

        let proposal_review = ProposalReview {
            proposal_id,
            user_id,
            status: ProposalReviewStatus::Draft,
            created_at: DateTime::new(date_time)?,
            summary: request.summary.unwrap_or("".to_string()),
            review_duration_mins: request.review_duration_mins.unwrap_or(0),
            build_reproduced: request.build_reproduced.unwrap_or(false),
            reproduced_build_image_id: None,
        };

        let id = self
            .proposal_review_repository
            .create_proposal_review(proposal_review.clone())
            .await?;

        Ok(map_create_proposal_review_response(id, proposal_review))
    }
}

impl<PR: ProposalReviewRepository, U: UserProfileRepository, P: ProposalRepository>
    ProposalReviewServiceImpl<PR, U, P>
{
    fn new(
        proposal_review_repository: PR,
        user_profile_repository: U,
        proposal_repository: P,
    ) -> Self {
        Self {
            proposal_review_repository,
            user_profile_repository,
            proposal_repository,
        }
    }

    fn validate_request(
        &self,
        summary: &Option<String>,
        review_duration_mins: Option<u16>,
    ) -> Result<(), ApiError> {
        if let Some(summary) = summary {
            if summary.is_empty() {
                return Err(ApiError::invalid_argument("Summary cannot be empty"));
            }

            if summary.chars().count() > MAX_PROPOSAL_REVIEW_SUMMARY_CHARS {
                return Err(ApiError::invalid_argument(&format!(
                    "Summary must be less than {} characters",
                    MAX_PROPOSAL_REVIEW_SUMMARY_CHARS
                )));
            }
        }

        if let Some(review_duration_mins) = review_duration_mins {
            if review_duration_mins == 0 {
                return Err(ApiError::invalid_argument("Review duration cannot be 0"));
            }

            if review_duration_mins > MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS {
                return Err(ApiError::invalid_argument(&format!(
                    "Review duration must be less than {} minutes",
                    MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS
                )));
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        repositories::{
            MockProposalRepository, MockProposalReviewRepository, MockUserProfileRepository,
        },
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    #[case::empty(proposal_review_create_empty())]
    #[case::full(proposal_review_create())]
    async fn create_proposal_review(
        #[case] fixture: (ProposalReview, CreateProposalReviewRequest),
    ) {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let (proposal_review, request) = fixture;
        let proposal_id = Uuid::try_from(request.proposal_id.as_str()).unwrap();
        let id = fixtures::proposal_review_id();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_create_proposal_review()
            .once()
            .with(eq(proposal_review.clone()))
            .return_const(Ok(id));

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap();

        assert_eq!(
            result,
            CreateProposalReviewResponse {
                id: id.to_string(),
                proposal_review: proposal_review.into(),
            }
        );
    }

    #[rstest]
    #[case::summary_empty(proposal_review_create_summary_empty())]
    #[case::summary_too_long(proposal_review_create_summary_too_long())]
    #[case::review_duration_zero(proposal_review_create_review_duration_zero())]
    #[case::review_duration_too_long(proposal_review_create_review_duration_too_long())]
    async fn create_proposal_review_invalid(
        #[case] fixture: (CreateProposalReviewRequest, ApiError),
    ) {
        let calling_principal = fixtures::principal();
        let (request, api_error) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock.expect_get_user_id_by_principal().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock.expect_create_proposal_review().never();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(result, api_error);
    }

    #[rstest]
    async fn create_proposal_review_no_user() {
        let calling_principal = fixtures::principal();
        let (_, request) = proposal_review_create();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock.expect_create_proposal_review().never();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "User id for principal {} not found",
                calling_principal.to_text()
            ))
        );
    }

    #[rstest]
    async fn create_proposal_review_no_proposal() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let (_, request) = proposal_review_create();
        let proposal_id = Uuid::try_from(request.proposal_id.as_str()).unwrap();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock.expect_create_proposal_review().never();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request.clone())
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "Proposal with Id {} not found",
                request.proposal_id
            ))
        );
    }

    #[rstest]
    async fn create_proposal_review_already_completed() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let (_, request) = proposal_review_create();
        let proposal_id = Uuid::try_from(request.proposal_id.as_str()).unwrap();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(Some(
                fixtures::nns_replica_version_management_proposal_completed(),
            ));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock.expect_create_proposal_review().never();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal with Id {} is already completed",
                proposal_id.to_string()
            ))
        );
    }

    #[fixture]
    fn proposal_review_create() -> (ProposalReview, CreateProposalReviewRequest) {
        let date_time = get_date_time().unwrap();
        let proposal_review = ProposalReview {
            created_at: DateTime::new(date_time).unwrap(),
            ..fixtures::proposal_review_draft()
        };

        (
            proposal_review.clone(),
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: Some(proposal_review.summary.clone()),
                review_duration_mins: Some(proposal_review.review_duration_mins),
                build_reproduced: Some(proposal_review.build_reproduced),
                reproduced_build_image_id: None,
            },
        )
    }

    #[fixture]
    fn proposal_review_create_empty() -> (ProposalReview, CreateProposalReviewRequest) {
        let date_time = get_date_time().unwrap();
        let proposal_review = ProposalReview {
            created_at: DateTime::new(date_time).unwrap(),
            summary: "".to_string(),
            review_duration_mins: 0,
            build_reproduced: false,
            ..fixtures::proposal_review_draft()
        };

        (
            proposal_review.clone(),
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: None,
                review_duration_mins: None,
                build_reproduced: None,
                reproduced_build_image_id: None,
            },
        )
    }

    #[fixture]
    fn proposal_review_create_summary_empty() -> (CreateProposalReviewRequest, ApiError) {
        let proposal_review = fixtures::proposal_review_draft();

        (
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: Some("".to_string()),
                review_duration_mins: Some(proposal_review.review_duration_mins),
                build_reproduced: Some(proposal_review.build_reproduced),
                reproduced_build_image_id: None,
            },
            ApiError::invalid_argument("Summary cannot be empty"),
        )
    }

    #[fixture]
    fn proposal_review_create_summary_too_long() -> (CreateProposalReviewRequest, ApiError) {
        let proposal_review = fixtures::proposal_review_draft();

        (
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: Some("a".repeat(MAX_PROPOSAL_REVIEW_SUMMARY_CHARS + 1)),
                review_duration_mins: Some(proposal_review.review_duration_mins),
                build_reproduced: Some(proposal_review.build_reproduced),
                reproduced_build_image_id: None,
            },
            ApiError::invalid_argument(&format!(
                "Summary must be less than {} characters",
                MAX_PROPOSAL_REVIEW_SUMMARY_CHARS
            )),
        )
    }

    #[fixture]
    fn proposal_review_create_review_duration_zero() -> (CreateProposalReviewRequest, ApiError) {
        let proposal_review = fixtures::proposal_review_draft();

        (
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: Some(proposal_review.summary),
                review_duration_mins: Some(0),
                build_reproduced: Some(proposal_review.build_reproduced),
                reproduced_build_image_id: None,
            },
            ApiError::invalid_argument("Review duration cannot be 0"),
        )
    }

    #[fixture]
    fn proposal_review_create_review_duration_too_long() -> (CreateProposalReviewRequest, ApiError)
    {
        let proposal_review = fixtures::proposal_review_draft();

        (
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: Some(proposal_review.summary),
                review_duration_mins: Some(MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS + 1),
                build_reproduced: Some(proposal_review.build_reproduced),
                reproduced_build_image_id: None,
            },
            ApiError::invalid_argument(&format!(
                "Review duration must be less than {} minutes",
                MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS
            )),
        )
    }
}
