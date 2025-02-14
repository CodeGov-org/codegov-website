use backend_api::{
    ApiError, CreateProposalReviewCommitRequest, CreateProposalReviewCommitResponse,
    DeleteProposalReviewCommitRequest, UpdateProposalReviewCommitRequest,
};
use candid::Principal;

use crate::{
    mappings::map_proposal_review_commit,
    repositories::{
        CommitSha, DateTime, ProposalRepository, ProposalRepositoryImpl, ProposalReviewCommit,
        ProposalReviewCommitRepository, ProposalReviewCommitRepositoryImpl,
        ProposalReviewRepository, ProposalReviewRepositoryImpl, UserProfileRepository,
        UserProfileRepositoryImpl, Uuid,
    },
    system_api::get_date_time,
};

const MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER: usize = 50;
const MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS: usize = 1000;

#[cfg_attr(test, mockall::automock)]
pub trait ProposalReviewCommitService {
    fn create_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewCommitRequest,
    ) -> Result<CreateProposalReviewCommitResponse, ApiError>;

    fn update_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: UpdateProposalReviewCommitRequest,
    ) -> Result<(), ApiError>;

    fn delete_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: DeleteProposalReviewCommitRequest,
    ) -> Result<(), ApiError>;
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
    fn create_proposal_review_commit(
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
            .get_proposal_review_commits_by_proposal_review_id_and_user_id(
                proposal_review_id,
                user_id,
            )?
            .len()
            >= MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER
        {
            return Err(ApiError::conflict(&format!(
                "User with Id {} has already created {} proposal review commits for proposal review with Id {}",
                user_id,
                MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER,
                proposal_review_id
            )));
        }

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
                user_id,
                proposal_review_id,
                commit_sha
            )));
        }

        self.check_proposal_review_and_proposal(&user_id, &proposal_review_id)?;

        let date_time = get_date_time()?;

        let proposal_review_commit = ProposalReviewCommit {
            proposal_review_id,
            user_id,
            created_at: DateTime::new(date_time)?,
            last_updated_at: None,
            commit_sha,
            state: request.state.into(),
        };

        let id = self
            .proposal_review_commit_repository
            .create_proposal_review_commit(proposal_review_commit.clone())?;

        Ok(map_proposal_review_commit(id, proposal_review_commit))
    }

    fn update_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: UpdateProposalReviewCommitRequest,
    ) -> Result<(), ApiError> {
        self.validate_fields(&request.state)?;

        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let id = Uuid::try_from(request.id.as_str())?;
        let mut current_proposal_review_commit =
            self.get_proposal_review_commit_with_check_user_id(&id, &user_id)?;

        self.check_proposal_review_and_proposal(
            &user_id,
            &current_proposal_review_commit.proposal_review_id,
        )?;

        current_proposal_review_commit.state = request.state.into();

        let date_time = get_date_time()?;
        current_proposal_review_commit.last_updated_at = Some(DateTime::new(date_time)?);

        self.proposal_review_commit_repository
            .update_proposal_review_commit(id, current_proposal_review_commit)
    }

    fn delete_proposal_review_commit(
        &self,
        calling_principal: Principal,
        request: DeleteProposalReviewCommitRequest,
    ) -> Result<(), ApiError> {
        let proposal_review_commit_id = Uuid::try_from(request.id.as_str())?;

        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let proposal_review_id = self
            .get_proposal_review_commit_with_check_user_id(&proposal_review_commit_id, &user_id)?
            .proposal_review_id;

        self.check_proposal_review_and_proposal(&user_id, &proposal_review_id)?;

        self.proposal_review_commit_repository
            .delete_proposal_review_commit(&proposal_review_commit_id)
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
            comment: Some(comment),
            ..
        } = state
        {
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

        Ok(())
    }

    fn get_proposal_review_commit_with_check_user_id(
        &self,
        proposal_review_commit_id: &Uuid,
        user_id: &Uuid,
    ) -> Result<ProposalReviewCommit, ApiError> {
        let proposal_review_commit = self
            .proposal_review_commit_repository
            .get_proposal_review_commit_by_id(proposal_review_commit_id)
            .ok_or(ApiError::not_found(&format!(
                "Proposal review commit with Id {} not found",
                proposal_review_commit_id
            )))?;

        if proposal_review_commit.user_id.ne(user_id) {
            return Err(ApiError::permission_denied(&format!(
                "Proposal review commit with Id {} does not belong to user with Id {}",
                proposal_review_commit_id, user_id,
            )));
        }

        Ok(proposal_review_commit)
    }

    fn check_proposal_review_and_proposal(
        &self,
        user_id: &Uuid,
        proposal_review_id: &Uuid,
    ) -> Result<(), ApiError> {
        let proposal_id = match self
            .proposal_review_repository
            .get_proposal_review_by_id(proposal_review_id)
        {
            Some(proposal_review) => {
                if proposal_review.is_published() {
                    return Err(ApiError::conflict(&format!(
                        "Proposal review with Id {} is already published",
                        proposal_review_id
                    )));
                }

                if proposal_review.user_id.ne(user_id) {
                    return Err(ApiError::permission_denied(&format!(
                        "Proposal review with Id {} does not belong to user with Id {}",
                        proposal_review_id, user_id,
                    )));
                }

                proposal_review.proposal_id
            }
            None => {
                return Err(ApiError::not_found(&format!(
                    "Proposal review with Id {} not found",
                    proposal_review_id
                )))
            }
        };

        // the associated proposal should always exist
        if let Some(proposal) = self.proposal_repository.get_proposal_by_id(&proposal_id) {
            if proposal.is_completed() {
                return Err(ApiError::conflict(&format!(
                    "Proposal with Id {} is already completed",
                    proposal_id
                )));
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::iter::repeat;

    use super::*;
    use crate::{
        fixtures::{self, uuid_a},
        repositories::{
            MockProposalRepository, MockProposalReviewCommitRepository,
            MockProposalReviewRepository, MockUserProfileRepository, Proposal, ProposalReview,
            ProposalReviewCommitId, ProposalReviewStatus,
        },
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    #[case::not_reviewed(proposal_review_commit_create_not_reviewed())]
    #[case::reviewed(proposal_review_commit_create_reviewed())]
    fn create_proposal_review(
        #[case] fixture: (
            ProposalReviewCommit,
            ProposalReview,
            Proposal,
            CreateProposalReviewCommitRequest,
        ),
    ) {
        let calling_principal = fixtures::principal_a();
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
            .expect_get_proposal_review_commits_by_proposal_review_id_and_user_id()
            .once()
            .with(eq(proposal_review_id), eq(user_id))
            .return_const(Ok(vec![]));
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
    fn create_proposal_review_commit_no_user() {
        let calling_principal = fixtures::principal_a();
        let (_, _, _, request) = proposal_review_commit_create_not_reviewed();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commits_by_proposal_review_id_and_user_id()
            .never();
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
    fn create_proposal_review_commit_too_many() {
        let calling_principal = fixtures::principal_a();
        let (proposal_review_commit, _, _, request) = proposal_review_commit_create_not_reviewed();
        let user_id = proposal_review_commit.user_id;
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();

        // in a real scenario, all proposal review commits
        // have different commit sha and ids
        let existing_proposal_review_commits = repeat((uuid_a(), proposal_review_commit))
            .take(MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER)
            .collect();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commits_by_proposal_review_id_and_user_id()
            .once()
            .with(eq(proposal_review_id), eq(user_id))
            .return_const(Ok(existing_proposal_review_commits));
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
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "User with Id {} has already created {} proposal review commits for proposal review with Id {}",
                user_id,
                MAX_PROPOSAL_REVIEW_COMMITS_PER_PROPOSAL_REVIEW_PER_USER,
                proposal_review_id
            ))
        );
    }

    #[rstest]
    fn create_proposal_review_commit_already_created() {
        let calling_principal = fixtures::principal_a();
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
            .expect_get_proposal_review_commits_by_proposal_review_id_and_user_id()
            .once()
            .with(eq(proposal_review_id), eq(user_id))
            .return_const(Ok(vec![]));
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
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "User with Id {} has already created a commit review for proposal review with Id {} and commit sha {}",
                user_id,
                proposal_review_id,
                commit_sha
            ))
        );
    }

    #[rstest]
    #[case::not_found(proposal_review_commit_create_proposal_review_not_found())]
    #[case::published(proposal_review_commit_create_proposal_review_published())]
    #[case::another_user(proposal_review_commit_create_proposal_review_another_user())]
    fn create_proposal_review_proposal_review_invalid(
        #[case] fixture: (
            ProposalReviewCommit,
            Option<ProposalReview>,
            Proposal,
            CreateProposalReviewCommitRequest,
            ApiError,
        ),
    ) {
        let calling_principal = fixtures::principal_a();
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
            .expect_get_proposal_review_commits_by_proposal_review_id_and_user_id()
            .once()
            .with(eq(proposal_review_id), eq(user_id))
            .return_const(Ok(vec![]));
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
            .return_const(proposal_review);
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
            .unwrap_err();

        assert_eq!(result, expected_result);
    }

    #[rstest]
    fn create_proposal_review_commit_proposal_completed() {
        let calling_principal = fixtures::principal_a();
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
            .expect_get_proposal_review_commits_by_proposal_review_id_and_user_id()
            .once()
            .with(eq(proposal_review_id), eq(user_id))
            .return_const(Ok(vec![]));
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
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal with Id {} is already completed",
                proposal_review.proposal_id
            ))
        );
    }

    #[rstest]
    #[case::comment_empty(proposal_review_commit_create_comment_empty())]
    #[case::comment_too_long(proposal_review_commit_create_comment_too_long())]
    fn create_proposal_review_commit_comment_invalid_fields(
        #[case] fixture: (CreateProposalReviewCommitRequest, ApiError),
    ) {
        let calling_principal = fixtures::principal_a();
        let (request, expected_result) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock.expect_get_user_id_by_principal().never();
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commits_by_proposal_review_id_and_user_id()
            .never();
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
        let proposal = fixtures::nns_replica_version_management_proposal(None, None);

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
        let proposal = fixtures::nns_replica_version_management_proposal(None, None);

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
    fn proposal_review_commit_create_proposal_review_not_found() -> (
        ProposalReviewCommit,
        Option<ProposalReview>,
        Proposal,
        CreateProposalReviewCommitRequest,
        ApiError,
    ) {
        let (prc, _, p, request) = proposal_review_commit_create_reviewed();
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();

        (
            prc,
            None,
            p,
            request,
            ApiError::not_found(&format!(
                "Proposal review with Id {} not found",
                proposal_review_id
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_create_proposal_review_published() -> (
        ProposalReviewCommit,
        Option<ProposalReview>,
        Proposal,
        CreateProposalReviewCommitRequest,
        ApiError,
    ) {
        let (prc, pr, p, request) = proposal_review_commit_create_reviewed();
        let proposal_review_id = Uuid::try_from(request.proposal_review_id.as_str()).unwrap();

        (
            prc,
            Some(ProposalReview {
                status: ProposalReviewStatus::Published,
                ..pr
            }),
            p,
            request,
            ApiError::conflict(&format!(
                "Proposal review with Id {} is already published",
                proposal_review_id
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_create_proposal_review_another_user() -> (
        ProposalReviewCommit,
        Option<ProposalReview>,
        Proposal,
        CreateProposalReviewCommitRequest,
        ApiError,
    ) {
        let (prc, pr, p, request) = proposal_review_commit_create_reviewed();
        let user_id = fixtures::uuid_b();

        (
            prc.clone(),
            Some(ProposalReview { user_id, ..pr }),
            p,
            request,
            ApiError::permission_denied(&format!(
                "Proposal review with Id {} does not belong to user with Id {}",
                prc.proposal_review_id, prc.user_id,
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
            fixtures::nns_replica_version_management_proposal_completed(None, None),
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
                    matches_description: None,
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
                    matches_description: None,
                },
            },
            ApiError::invalid_argument(&format!(
                "Comment must be less than {} characters",
                MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS
            )),
        )
    }

    #[rstest]
    #[case::reviewed(proposal_review_commit_update_reviewed())]
    #[case::not_reviewed(proposal_review_commit_update_not_reviewed())]
    fn update_proposal_review_commit(
        #[case] fixture: (
            ProposalReviewCommitId,
            ProposalReviewCommit,
            ProposalReview,
            Proposal,
            UpdateProposalReviewCommitRequest,
            ProposalReviewCommit,
        ),
    ) {
        let calling_principal = fixtures::principal_a();
        let user_id = fixtures::uuid_a();
        let (
            id,
            original_proposal_review_commit,
            proposal_review,
            proposal,
            request,
            updated_proposal_review_commit,
        ) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(Some(original_proposal_review_commit.clone()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(original_proposal_review_commit.proposal_review_id))
            .return_const(Some(proposal_review.clone()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_review.proposal_id))
            .return_const(Some(proposal));

        prc_repository_mock
            .expect_update_proposal_review_commit()
            .once()
            .with(eq(id), eq(updated_proposal_review_commit))
            .return_const(Ok(()));

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        service
            .update_proposal_review_commit(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    fn update_proposal_review_commit_no_user() {
        let calling_principal = fixtures::principal_a();
        let (_, _, _, _, request, _) = proposal_review_commit_update_reviewed();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_update_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .update_proposal_review_commit(calling_principal, request)
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
    fn update_proposal_review_commit_not_found() {
        let calling_principal = fixtures::principal_a();
        let (id, original_proposal_review_commit, _, _, request, _) =
            proposal_review_commit_update_reviewed();
        let user_id = original_proposal_review_commit.user_id;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_update_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .update_proposal_review_commit(calling_principal, request.clone())
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "Proposal review commit with Id {} not found",
                request.id
            ))
        );
    }

    #[rstest]
    fn update_proposal_review_commit_another_user() {
        let calling_principal = fixtures::principal_a();
        let (id, original_proposal_review_commit, _, _, request, _) =
            proposal_review_commit_update_reviewed();
        let user_id = original_proposal_review_commit.user_id;
        let original_proposal_review_commit = ProposalReviewCommit {
            user_id: fixtures::uuid_b(),
            ..original_proposal_review_commit
        };

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(Some(original_proposal_review_commit.clone()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_update_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .update_proposal_review_commit(calling_principal, request.clone())
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::permission_denied(&format!(
                "Proposal review commit with Id {} does not belong to user with Id {}",
                request.id, user_id,
            ))
        );
    }

    #[rstest]
    #[case::not_found(proposal_review_commit_update_proposal_review_not_found())]
    #[case::published(proposal_review_commit_update_proposal_review_published())]
    #[case::another_user(proposal_review_commit_update_proposal_review_another_user())]
    async fn update_proposal_review_proposal_review_invalid(
        #[case] fixture: (
            ProposalReviewCommitId,
            ProposalReviewCommit,
            Option<ProposalReview>,
            UpdateProposalReviewCommitRequest,
            ApiError,
        ),
    ) {
        let calling_principal = fixtures::principal_a();
        let (id, original_proposal_review_commit, proposal_review, request, expected_error) =
            fixture;
        let user_id = original_proposal_review_commit.user_id;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(Some(original_proposal_review_commit.clone()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(original_proposal_review_commit.proposal_review_id))
            .return_const(proposal_review);
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_update_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .update_proposal_review_commit(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, expected_error);
    }

    #[rstest]
    fn update_proposal_review_commit_proposal_completed() {
        let calling_principal = fixtures::principal_a();
        let (id, original_proposal_review_commit, proposal_review, proposal, request) =
            proposal_review_commit_update_proposal_completed();
        let user_id = original_proposal_review_commit.user_id;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(Some(original_proposal_review_commit.clone()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(original_proposal_review_commit.proposal_review_id))
            .return_const(Some(proposal_review.clone()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_review.proposal_id))
            .return_const(Some(proposal));

        prc_repository_mock
            .expect_update_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .update_proposal_review_commit(calling_principal, request)
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal with Id {} is already completed",
                proposal_review.proposal_id
            ))
        )
    }

    #[rstest]
    #[case::comment_empty(proposal_review_commit_update_comment_empty())]
    #[case::comment_too_long(proposal_review_commit_update_comment_too_long())]
    async fn update_proposal_review_commit_comment_invalid_fields(
        #[case] fixture: (UpdateProposalReviewCommitRequest, ApiError),
    ) {
        let calling_principal = fixtures::principal_a();
        let (request, expected_error) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock.expect_get_user_id_by_principal().never();
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_update_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .update_proposal_review_commit(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, expected_error);
    }

    #[fixture]
    fn proposal_review_commit_update_reviewed() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        ProposalReview,
        Proposal,
        UpdateProposalReviewCommitRequest,
        ProposalReviewCommit,
    ) {
        let id = fixtures::proposal_review_commit_id();
        let date_time = get_date_time().unwrap();
        let user_id = fixtures::uuid_a();
        let original_proposal_review_commit = ProposalReviewCommit {
            user_id,
            ..fixtures::proposal_review_commit_not_reviewed()
        };
        let proposal_review = ProposalReview {
            user_id,
            ..fixtures::proposal_review_draft()
        };
        let proposal = fixtures::nns_replica_version_management_proposal(None, None);
        let state = backend_api::ReviewCommitState::Reviewed {
            comment: Some("Review commit comment".to_string()),
            matches_description: Some(true),
        };

        (
            id,
            original_proposal_review_commit.clone(),
            proposal_review,
            proposal,
            UpdateProposalReviewCommitRequest {
                id: id.to_string(),
                state: state.clone(),
            },
            ProposalReviewCommit {
                state: state.into(),
                last_updated_at: Some(DateTime::new(date_time).unwrap()),
                ..original_proposal_review_commit
            },
        )
    }

    #[fixture]
    fn proposal_review_commit_update_not_reviewed() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        ProposalReview,
        Proposal,
        UpdateProposalReviewCommitRequest,
        ProposalReviewCommit,
    ) {
        let id = fixtures::proposal_review_commit_id();
        let date_time = get_date_time().unwrap();
        let user_id = fixtures::uuid_a();
        let original_proposal_review_commit = ProposalReviewCommit {
            user_id,
            ..fixtures::proposal_review_commit_reviewed()
        };
        let proposal_review = ProposalReview {
            user_id,
            ..fixtures::proposal_review_draft()
        };
        let proposal = fixtures::nns_replica_version_management_proposal(None, None);
        let state = backend_api::ReviewCommitState::NotReviewed;

        (
            id,
            original_proposal_review_commit.clone(),
            proposal_review,
            proposal,
            UpdateProposalReviewCommitRequest {
                id: id.to_string(),
                state: state.clone(),
            },
            ProposalReviewCommit {
                state: state.into(),
                last_updated_at: Some(DateTime::new(date_time).unwrap()),
                ..original_proposal_review_commit
            },
        )
    }

    #[fixture]
    fn proposal_review_commit_update_proposal_review_not_found() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        Option<ProposalReview>,
        UpdateProposalReviewCommitRequest,
        ApiError,
    ) {
        let (id, prc, _, _, request, _) = proposal_review_commit_update_reviewed();

        (
            id,
            prc.clone(),
            None,
            request,
            ApiError::not_found(&format!(
                "Proposal review with Id {} not found",
                prc.proposal_review_id,
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_update_proposal_review_published() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        Option<ProposalReview>,
        UpdateProposalReviewCommitRequest,
        ApiError,
    ) {
        let (id, prc, pr, _, request, _) = proposal_review_commit_update_reviewed();

        (
            id,
            prc.clone(),
            Some(ProposalReview {
                status: ProposalReviewStatus::Published,
                ..pr
            }),
            request,
            ApiError::conflict(&format!(
                "Proposal review with Id {} is already published",
                prc.proposal_review_id,
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_update_proposal_review_another_user() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        Option<ProposalReview>,
        UpdateProposalReviewCommitRequest,
        ApiError,
    ) {
        let (id, prc, pr, _, request, _) = proposal_review_commit_update_reviewed();
        let user_id = fixtures::uuid_b();

        (
            id,
            prc.clone(),
            Some(ProposalReview { user_id, ..pr }),
            request,
            ApiError::permission_denied(&format!(
                "Proposal review with Id {} does not belong to user with Id {}",
                prc.proposal_review_id, prc.user_id,
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_update_proposal_completed() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        ProposalReview,
        Proposal,
        UpdateProposalReviewCommitRequest,
    ) {
        let (id, prc, pr, _, request, _) = proposal_review_commit_update_reviewed();

        (
            id,
            prc,
            pr,
            fixtures::nns_replica_version_management_proposal_completed(None, None),
            request,
        )
    }

    #[fixture]
    fn proposal_review_commit_update_comment_empty() -> (UpdateProposalReviewCommitRequest, ApiError)
    {
        let id = fixtures::proposal_review_commit_id();

        (
            UpdateProposalReviewCommitRequest {
                id: id.to_string(),
                state: backend_api::ReviewCommitState::Reviewed {
                    comment: Some("".to_string()),
                    matches_description: None,
                },
            },
            ApiError::invalid_argument("Comment cannot be empty"),
        )
    }

    #[fixture]
    fn proposal_review_commit_update_comment_too_long(
    ) -> (UpdateProposalReviewCommitRequest, ApiError) {
        let id = fixtures::proposal_review_commit_id();

        (
            UpdateProposalReviewCommitRequest {
                id: id.to_string(),
                state: backend_api::ReviewCommitState::Reviewed {
                    comment: Some("a".repeat(MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS + 1)),
                    matches_description: None,
                },
            },
            ApiError::invalid_argument(&format!(
                "Comment must be less than {} characters",
                MAX_PROPOSAL_REVIEW_COMMIT_COMMENT_CHARS
            )),
        )
    }

    #[rstest]
    fn delete_proposal_review_commit() {
        let calling_principal = fixtures::principal_a();
        let id = fixtures::proposal_review_commit_id();
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();
        let proposal_review = ProposalReview {
            user_id: proposal_review_commit.user_id,
            ..fixtures::proposal_review_draft()
        };
        let proposal = fixtures::nns_replica_version_management_proposal(None, None);

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(proposal_review_commit.user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(Some(proposal_review_commit.clone()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(proposal_review_commit.proposal_review_id))
            .return_const(Some(proposal_review.clone()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_review.proposal_id))
            .return_const(Some(proposal));

        prc_repository_mock
            .expect_delete_proposal_review_commit()
            .once()
            .with(eq(id))
            .return_const(Ok(()));

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        service
            .delete_proposal_review_commit(
                calling_principal,
                DeleteProposalReviewCommitRequest { id: id.to_string() },
            )
            .unwrap();
    }

    #[rstest]
    fn delete_proposal_review_commit_no_user() {
        let calling_principal = fixtures::principal_a();
        let id = fixtures::proposal_review_commit_id();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_delete_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .delete_proposal_review_commit(
                calling_principal,
                DeleteProposalReviewCommitRequest { id: id.to_string() },
            )
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
    fn delete_proposal_review_commit_not_found() {
        let calling_principal = fixtures::principal_a();
        let id = fixtures::proposal_review_commit_id();
        let user_id = fixtures::user_id();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_delete_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .delete_proposal_review_commit(
                calling_principal,
                DeleteProposalReviewCommitRequest { id: id.to_string() },
            )
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!("Proposal review commit with Id {} not found", id))
        )
    }

    #[rstest]
    fn delete_proposal_review_commit_another_user() {
        let calling_principal = fixtures::principal_a();
        let id = fixtures::proposal_review_commit_id();
        let user_id = fixtures::uuid_a();
        let proposal_review_commit = ProposalReviewCommit {
            user_id: fixtures::uuid_b(),
            ..fixtures::proposal_review_commit_reviewed()
        };

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(Some(proposal_review_commit.clone()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_delete_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .delete_proposal_review_commit(
                calling_principal,
                DeleteProposalReviewCommitRequest { id: id.to_string() },
            )
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::permission_denied(&format!(
                "Proposal review commit with Id {} does not belong to user with Id {}",
                id, user_id,
            ))
        )
    }

    #[rstest]
    #[case::not_found(proposal_review_commit_delete_proposal_review_not_found())]
    #[case::published(proposal_review_commit_delete_proposal_review_published())]
    #[case::another_user(proposal_review_commit_delete_proposal_review_another_user())]
    fn delete_proposal_review_commit_proposal_review_invalid(
        #[case] fixture: (
            ProposalReviewCommitId,
            ProposalReviewCommit,
            Option<ProposalReview>,
            ApiError,
        ),
    ) {
        let calling_principal = fixtures::principal_a();
        let (id, proposal_review_commit, proposal_review, expected_error) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(proposal_review_commit.user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(Some(proposal_review_commit.clone()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(proposal_review_commit.proposal_review_id))
            .return_const(proposal_review);
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();

        prc_repository_mock
            .expect_delete_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .delete_proposal_review_commit(
                calling_principal,
                DeleteProposalReviewCommitRequest { id: id.to_string() },
            )
            .unwrap_err();

        assert_eq!(result, expected_error)
    }

    #[rstest]
    fn delete_proposal_review_commit_proposal_completed() {
        let calling_principal = fixtures::principal_a();
        let id = fixtures::proposal_review_commit_id();
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();
        let proposal_review = ProposalReview {
            user_id: proposal_review_commit.user_id,
            ..fixtures::proposal_review_draft()
        };
        let proposal = fixtures::nns_replica_version_management_proposal_completed(None, None);

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(proposal_review_commit.user_id));
        let mut prc_repository_mock = MockProposalReviewCommitRepository::new();
        prc_repository_mock
            .expect_get_proposal_review_commit_by_id()
            .once()
            .with(eq(id))
            .return_const(Some(proposal_review_commit.clone()));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_id()
            .once()
            .with(eq(proposal_review_commit.proposal_review_id))
            .return_const(Some(proposal_review.clone()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_review.proposal_id))
            .return_const(Some(proposal));

        prc_repository_mock
            .expect_delete_proposal_review_commit()
            .never();

        let service = ProposalReviewCommitServiceImpl::new(
            prc_repository_mock,
            u_repository_mock,
            pr_repository_mock,
            p_repository_mock,
        );

        let result = service
            .delete_proposal_review_commit(
                calling_principal,
                DeleteProposalReviewCommitRequest { id: id.to_string() },
            )
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal with Id {} is already completed",
                proposal_review.proposal_id
            ))
        )
    }

    #[fixture]
    fn proposal_review_commit_delete_proposal_review_not_found() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        Option<ProposalReview>,
        ApiError,
    ) {
        let id = fixtures::proposal_review_commit_id();
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();

        (
            id,
            proposal_review_commit.clone(),
            None,
            ApiError::not_found(&format!(
                "Proposal review with Id {} not found",
                proposal_review_commit.proposal_review_id,
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_delete_proposal_review_published() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        Option<ProposalReview>,
        ApiError,
    ) {
        let id = fixtures::proposal_review_commit_id();
        let proposal_review_commit = fixtures::proposal_review_commit_reviewed();
        let proposal_review = ProposalReview {
            status: ProposalReviewStatus::Published,
            ..fixtures::proposal_review_draft()
        };

        (
            id,
            proposal_review_commit.clone(),
            Some(proposal_review),
            ApiError::conflict(&format!(
                "Proposal review with Id {} is already published",
                proposal_review_commit.proposal_review_id,
            )),
        )
    }

    #[fixture]
    fn proposal_review_commit_delete_proposal_review_another_user() -> (
        ProposalReviewCommitId,
        ProposalReviewCommit,
        Option<ProposalReview>,
        ApiError,
    ) {
        let id = fixtures::proposal_review_commit_id();
        let user_id = fixtures::uuid_a();
        let proposal_review_commit = ProposalReviewCommit {
            user_id,
            ..fixtures::proposal_review_commit_reviewed()
        };
        let proposal_review = ProposalReview {
            user_id: fixtures::uuid_b(),
            ..fixtures::proposal_review_draft()
        };

        (
            id,
            proposal_review_commit.clone(),
            Some(proposal_review),
            ApiError::permission_denied(&format!(
                "Proposal review with Id {} does not belong to user with Id {}",
                proposal_review_commit.proposal_review_id, user_id,
            )),
        )
    }
}
