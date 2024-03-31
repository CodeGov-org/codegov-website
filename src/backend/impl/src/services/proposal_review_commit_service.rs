use backend_api::{
    ApiError, CreateProposalReviewCommitRequest, CreateProposalReviewCommitResponse,
};
use candid::Principal;

use crate::{
    mappings::map_create_proposal_review_commit_response,
    repositories::{
        CommitSha, DateTime, ProposalRepository, ProposalRepositoryImpl, ProposalReviewCommit,
        ProposalReviewCommitRepository, ProposalReviewCommitRepositoryImpl,
        ProposalReviewRepository, ProposalReviewRepositoryImpl, UserProfileRepository,
        UserProfileRepositoryImpl, Uuid,
    },
    system_api::get_date_time,
};

const MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS: usize = 1000;
const MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHTS_COUNT: usize = 5;
const MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHT_CHARS: usize = 100;

#[cfg_attr(test, mockall::automock)]
pub trait ProposalReviewCommitService {
    async fn create_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewCommitRequest,
    ) -> Result<CreateProposalReviewCommitResponse, ApiError>;
}

pub struct ProposalReviewCommitServiceImpl<
    PRC: ProposalReviewCommitRepository,
    U: UserProfileRepository,
    PR: ProposalReviewRepository,
    P: ProposalRepository,
> {
    proposal_review_commit_repository: PRC,
    user_profile_repository: U,
    proposal_review_repository: PR,
    proposal_repository: P,
}

impl Default
    for ProposalReviewCommitServiceImpl<
        ProposalReviewCommitRepositoryImpl,
        UserProfileRepositoryImpl,
        ProposalReviewRepositoryImpl,
        ProposalRepositoryImpl,
    >
{
    fn default() -> Self {
        Self::new(
            ProposalReviewCommitRepositoryImpl::default(),
            UserProfileRepositoryImpl::default(),
            ProposalReviewRepositoryImpl::default(),
            ProposalRepositoryImpl::default(),
        )
    }
}

impl<
        PRC: ProposalReviewCommitRepository,
        U: UserProfileRepository,
        PR: ProposalReviewRepository,
        P: ProposalRepository,
    > ProposalReviewCommitService for ProposalReviewCommitServiceImpl<PRC, U, PR, P>
{
    async fn create_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewCommitRequest,
    ) -> Result<CreateProposalReviewCommitResponse, ApiError> {
        self.validate_fields(&request.state)?;

        let commit_sha = CommitSha::try_from(request.commit_sha.as_str())?;

        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str())?;

        if self
            .proposal_review_commit_repository
            .get_proposal_review_commit_by_proposal_review_id_user_id_commit_sha(
                proposal_review_id,
                user_id,
                commit_sha,
            )
            .is_some()
        {
            return Err(ApiError::conflict(&format!(
                "User with Id {} has already created a commit review for proposal review with Id {} and commit sha {}",
                user_id.to_string(),
                proposal_review_id.to_string(),
                commit_sha.to_string()
            )));
        }

        let proposal_id = match self
            .proposal_review_repository
            .get_proposal_review_by_id(&proposal_review_id)
        {
            Some(proposal_review) => {
                if proposal_review.is_published() {
                    return Err(ApiError::conflict(&format!(
                        "Proposal review with Id {} is already published",
                        proposal_review_id.to_string()
                    )));
                }

                if proposal_review.user_id != user_id {
                    return Err(ApiError::permission_denied(&format!(
                        "Proposal review with Id {} does not belong to user with Id {}",
                        proposal_review_id.to_string(),
                        user_id.to_string(),
                    )));
                }

                proposal_review.proposal_id
            }
            None => {
                return Err(ApiError::not_found(&format!(
                    "Proposal review with Id {} not found",
                    request.proposal_review_id
                )))
            }
        };

        // the associated proposal should always exist
        if let Some(proposal) = self.proposal_repository.get_proposal_by_id(&proposal_id) {
            if proposal.is_completed() {
                return Err(ApiError::conflict(&format!(
                    "Proposal with Id {} is already completed",
                    proposal_id.to_string()
                )));
            }
        }

        let date_time = get_date_time()?;

        let proposal_review_commit = ProposalReviewCommit {
            proposal_review_id,
            user_id,
            created_at: DateTime::new(date_time)?,
            commit_sha,
            state: request.state.into(),
        };

        let id = self
            .proposal_review_commit_repository
            .create_proposal_review_commit(proposal_review_commit.clone())
            .await?;

        Ok(map_create_proposal_review_commit_response(
            id,
            proposal_review_commit,
        ))
    }
}

impl<
        PRC: ProposalReviewCommitRepository,
        U: UserProfileRepository,
        PR: ProposalReviewRepository,
        P: ProposalRepository,
    > ProposalReviewCommitServiceImpl<PRC, U, PR, P>
{
    fn new(
        proposal_review_commit_repository: PRC,
        user_profile_repository: U,
        proposal_review_repository: PR,
        proposal_repository: P,
    ) -> Self {
        Self {
            proposal_review_commit_repository,
            user_profile_repository,
            proposal_review_repository,
            proposal_repository,
        }
    }

    fn validate_fields(&self, state: &backend_api::ReviewCommitState) -> Result<(), ApiError> {
        if let backend_api::ReviewCommitState::Reviewed {
            comment,
            highlights,
            ..
        } = state
        {
            if let Some(comment) = comment {
                if comment.is_empty() {
                    return Err(ApiError::invalid_argument("Comment cannot be empty"));
                }
                if comment.chars().count() > MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS {
                    return Err(ApiError::invalid_argument(&format!(
                        "Comment must be less than {} characters",
                        MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS
                    )));
                }
            }

            if highlights.len() > MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHTS_COUNT {
                return Err(ApiError::invalid_argument(&format!(
                    "Number of highlights must be less than {}",
                    MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHTS_COUNT
                )));
            }

            for highlight in highlights {
                if highlight.is_empty() {
                    return Err(ApiError::invalid_argument("Highlight cannot be empty"));
                }

                if highlight.chars().count() > MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHT_CHARS {
                    return Err(ApiError::invalid_argument(&format!(
                        "Each highlight must be less than {} characters",
                        MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHT_CHARS
                    )));
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures::{self, uuid_a},
        repositories::{
            MockProposalRepository, MockProposalReviewCommitRepository,
            MockProposalReviewRepository, MockUserProfileRepository, Proposal, ProposalReview,
            ProposalReviewStatus,
        },
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    #[case::not_reviewed(proposal_review_commit_create_not_reviewed())]
    #[case::reviewed(proposal_review_commit_create_reviewed())]
    async fn create_proposal_review(
        #[case] fixture: (
            ProposalReviewCommit,
            ProposalReview,
            Proposal,
            CreateProposalReviewCommitRequest,
        ),
    ) {
        let calling_principal = fixtures::principal();
        let (proposal_review_commit, proposal_review, proposal, request) = fixture;
        let user_id = proposal_review_commit.user_id;
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();
        let commit_sha = CommitSha::try_from(request.commit_sha.as_str()).unwrap();
        let id = fixtures::proposal_review_commit_id();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_proposal_review_id_user_id_commit_sha()
            .once()
            .with(eq(proposal_review_id), eq(user_id), eq(commit_sha))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(proposal_review_id))
            .return_const(Some(proposal_review.clone()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_review.proposal_id))
            .return_const(Some(proposal));

        prc_repository_mock
            .expect_create_proposal_review_commit()
            .once()
            .with(eq(proposal_review_commit.clone()))
            .return_const(Ok(id));

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review_commit(calling_principal, request)
            .await
            .unwrap();

        assert_eq!(
            result,
            CreateProposalReviewCommitResponse {
                id: id.to_string(),
                proposal_review_commit: proposal_review_commit.into()
            }
        );
    }

    #[rstest]
    async fn create_proposal_review_commit_no_user() {
        let calling_principal = fixtures::principal();
        let (_, _, _, request) = proposal_review_commit_create_not_reviewed();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_proposal_review_id_user_id_commit_sha()
            .never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_create_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review_commit(calling_principal, request)
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
    async fn create_proposal_review_commit_already_created() {
        let calling_principal = fixtures::principal();
        let (proposal_review_commit, _, _, request) = proposal_review_commit_create_reviewed();
        let user_id = proposal_review_commit.user_id;
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();
        let commit_sha = CommitSha::try_from(request.commit_sha.as_str()).unwrap();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_proposal_review_id_user_id_commit_sha()
            .once()
            .with(eq(proposal_review_id), eq(user_id), eq(commit_sha))
            .return_const(Some((uuid_a(), proposal_review_commit)));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_create_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review_commit(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "User with Id {} has already created a commit review for proposal review with Id {} and commit sha {}",
                user_id.to_string(),
                proposal_review_id.to_string(),
                commit_sha.to_string()
            ))
        );
    }

    #[rstest]
    async fn create_proposal_review_commit_no_proposal_review() {
        let calling_principal = fixtures::principal();
        let (proposal_review_commit, _, _, request) = proposal_review_commit_create_not_reviewed();
        let user_id = proposal_review_commit.user_id;
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();
        let commit_sha = CommitSha::try_from(request.commit_sha.as_str()).unwrap();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_proposal_review_id_user_id_commit_sha()
            .once()
            .with(eq(proposal_review_id), eq(user_id), eq(commit_sha))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(proposal_review_id))
            .return_const(None);
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_create_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review_commit(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "Proposal review with Id {} not found",
                proposal_review_id.to_string()
            ))
        );
    }

    #[rstest]
    #[case::published(proposal_review_commit_create_proposal_review_published())]
    #[case::another_user(proposal_review_commit_create_proposal_review_another_user())]
    async fn create_proposal_review_proposal_review_invalid(
        #[case] fixture: (
            ProposalReviewCommit,
            ProposalReview,
            Proposal,
            CreateProposalReviewCommitRequest,
            ApiError,
        ),
    ) {
        let calling_principal = fixtures::principal();
        let (proposal_review_commit, proposal_review, _, request, expected_result) = fixture;
        let user_id = proposal_review_commit.user_id;
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();
        let commit_sha = CommitSha::try_from(request.commit_sha.as_str()).unwrap();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_proposal_review_id_user_id_commit_sha()
            .once()
            .with(eq(proposal_review_id), eq(user_id), eq(commit_sha))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(proposal_review_id))
            .return_const(Some(proposal_review));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_create_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review_commit(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(result, expected_result);
    }

    #[rstest]
    async fn create_proposal_review_commit_proposal_completed() {
        let calling_principal = fixtures::principal();
        let (proposal_review_commit, proposal_review, proposal, request) =
            proposal_review_commit_create_proposal_completed();
        let user_id = proposal_review_commit.user_id;
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();
        let commit_sha = CommitSha::try_from(request.commit_sha.as_str()).unwrap();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_proposal_review_id_user_id_commit_sha()
            .once()
            .with(eq(proposal_review_id), eq(user_id), eq(commit_sha))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(proposal_review_id))
            .return_const(Some(proposal_review.clone()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_review.proposal_id))
            .return_const(Some(proposal));

        prc_repository_mock
            .expect_create_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review_commit(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal with Id {} is already completed",
                proposal_review.proposal_id.to_string()
            ))
        );
    }

    #[rstest]
    #[case::comment_empty(proposal_review_commit_create_comment_empty())]
    #[case::comment_too_long(proposal_review_commit_create_comment_too_long())]
    #[case::highlights_too_many(proposal_review_commit_create_highlights_too_many())]
    #[case::highlight_item_empty(proposal_review_commit_create_highlights_item_empty())]
    #[case::highlight_item_too_long(proposal_review_commit_create_highlights_item_too_long())]
    async fn create_proposal_review_commit_comment_invalid_fields(
        #[case] fixture: (CreateProposalReviewCommitRequest, ApiError),
    ) {
        let calling_principal = fixtures::principal();
        let (request, expected_result) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock.expect_get_user_id_by_principal().never();
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_proposal_review_id_user_id_commit_sha()
            .never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_create_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .create_proposal_review_commit(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(result, expected_result);
    }

    #[fixture]
    fn proposal_review_commit_create_not_reviewed() -> (
        ProposalReviewCommit,
        ProposalReview,
        Proposal,
        CreateProposalReviewCommitRequest,
    ) {
        let date_time = get_date_time().unwrap();
        let user_id = fixtures::uuid_a();
        let proposal_review_commit = ProposalReviewCommit {
            user_id,
            created_at: DateTime::new(date_time).unwrap(),
            ..fixtures::proposal_review_commit_not_reviewed()
        };
        let proposal_review = ProposalReview {
            user_id,
            ..fixtures::proposal_review_draft()
        };
        let proposal = fixtures::nns_replica_version_management_proposal();

        (
            proposal_review_commit.clone(),
            proposal_review,
            proposal,
            CreateProposalReviewCommitRequest {
                proposal_review_id: proposal_review_commit.proposal_review_id.to_string(),
                commit_sha: proposal_review_commit.commit_sha.to_string(),
                state: proposal_review_commit.state.into(),
            },
        )
    }

    #[fixture]
    fn proposal_review_commit_create_reviewed() -> (
        ProposalReviewCommit,
        ProposalReview,
        Proposal,
        CreateProposalReviewCommitRequest,
    ) {
        let date_time = get_date_time().unwrap();
        let user_id = fixtures::uuid_a();
        let proposal_review_commit = ProposalReviewCommit {
            user_id,
            created_at: DateTime::new(date_time).unwrap(),
            ..fixtures::proposal_review_commit_reviewed()
        };
        let proposal_review = ProposalReview {
            user_id,
            ..fixtures::proposal_review_draft()
        };
        let proposal = fixtures::nns_replica_version_management_proposal();

        (
            proposal_review_commit.clone(),
            proposal_review,
            proposal,
            CreateProposalReviewCommitRequest {
                proposal_review_id: proposal_review_commit.proposal_review_id.to_string(),
                commit_sha: proposal_review_commit.commit_sha.to_string(),
                state: proposal_review_commit.state.into(),
            },
        )
    }

    #[fixture]
    fn proposal_review_commit_create_proposal_review_published() -> (
        ProposalReviewCommit,
        ProposalReview,
        Proposal,
        CreateProposalReviewCommitRequest,
        ApiError,
    ) {
        let (prc, pr, p, request) = proposal_review_commit_create_reviewed();
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();

        (
            prc,
            ProposalReview {
                status: ProposalReviewStatus::Published,
                ..pr
            },
            p,
            request,
            ApiError::conflict(&format!(
                "Proposal review with Id {} is already published",
                proposal_review_id.to_string()
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_create_proposal_review_another_user() -> (
        ProposalReviewCommit,
        ProposalReview,
        Proposal,
        CreateProposalReviewCommitRequest,
        ApiError,
    ) {
        let (prc, pr, p, request) = proposal_review_commit_create_reviewed();
        let user_id = fixtures::uuid_b();
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();

        (
            prc.clone(),
            ProposalReview { user_id, ..pr },
            p,
            request,
            ApiError::permission_denied(&format!(
                "Proposal review with Id {} does not belong to user with Id {}",
                proposal_review_id.to_string(),
                prc.user_id.to_string(),
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_create_proposal_completed() -> (
        ProposalReviewCommit,
        ProposalReview,
        Proposal,
        CreateProposalReviewCommitRequest,
    ) {
        let (prc, pr, _, request) = proposal_review_commit_create_reviewed();

        (
            prc,
            pr,
            fixtures::nns_replica_version_management_proposal_completed(),
            request,
        )
    }

    #[fixture]
    fn proposal_review_commit_create_comment_empty() -> (CreateProposalReviewCommitRequest, ApiError)
    {
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();

        (
            CreateProposalReviewCommitRequest {
                proposal_review_id: proposal_review_commit.proposal_review_id.to_string(),
                commit_sha: proposal_review_commit.commit_sha.to_string(),
                state: backend_api::ReviewCommitState::Reviewed {
                    comment: Some("".to_string()),
                    matches_description: true,
                    highlights: vec![],
                },
            },
            ApiError::invalid_argument("Comment cannot be empty"),
        )
    }

    #[fixture]
    fn proposal_review_commit_create_comment_too_long(
    ) -> (CreateProposalReviewCommitRequest, ApiError) {
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();

        (
            CreateProposalReviewCommitRequest {
                proposal_review_id: proposal_review_commit.proposal_review_id.to_string(),
                commit_sha: proposal_review_commit.commit_sha.to_string(),
                state: backend_api::ReviewCommitState::Reviewed {
                    comment: Some("a".repeat(MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS + 1)),
                    matches_description: true,
                    highlights: vec![],
                },
            },
            ApiError::invalid_argument(&format!(
                "Comment must be less than {} characters",
                MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_create_highlights_too_many(
    ) -> (CreateProposalReviewCommitRequest, ApiError) {
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();

        (
            CreateProposalReviewCommitRequest {
                proposal_review_id: proposal_review_commit.proposal_review_id.to_string(),
                commit_sha: proposal_review_commit.commit_sha.to_string(),
                state: backend_api::ReviewCommitState::Reviewed {
                    comment: None,
                    matches_description: true,
                    highlights: std::iter::repeat("a".to_string())
                        .take(MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHTS_COUNT + 1)
                        .collect(),
                },
            },
            ApiError::invalid_argument(&format!(
                "Number of highlights must be less than {}",
                MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHTS_COUNT
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_create_highlights_item_empty(
    ) -> (CreateProposalReviewCommitRequest, ApiError) {
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();

        (
            CreateProposalReviewCommitRequest {
                proposal_review_id: proposal_review_commit.proposal_review_id.to_string(),
                commit_sha: proposal_review_commit.commit_sha.to_string(),
                state: backend_api::ReviewCommitState::Reviewed {
                    comment: None,
                    matches_description: true,
                    highlights: vec!["highlight".to_string(), "".to_string()],
                },
            },
            ApiError::invalid_argument("Highlight cannot be empty"),
        )
    }

    #[fixture]
    fn proposal_review_commit_create_highlights_item_too_long(
    ) -> (CreateProposalReviewCommitRequest, ApiError) {
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();

        (
            CreateProposalReviewCommitRequest {
                proposal_review_id: proposal_review_commit.proposal_review_id.to_string(),
                commit_sha: proposal_review_commit.commit_sha.to_string(),
                state: backend_api::ReviewCommitState::Reviewed {
                    comment: None,
                    matches_description: true,
                    highlights: vec![
                        "highlight".to_string(),
                        "a".repeat(MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHT_CHARS + 1),
                    ],
                },
            },
            ApiError::invalid_argument(&format!(
                "Each highlight must be less than {} characters",
                MAX_PROPOSAL_REVIEW_COMMIT_HIGHLIGHT_CHARS
            )),
        )
    }
}
