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

        if self
            .proposal_review_commit_repository
            .get_proposal_review_commit_by_proposal_review_id_and_user_id(
                proposal_review_id,
                user_id,
            )
            .is_some()
        {
            return Err(ApiError::conflict(&format!(
                "User with Id {} has already created a commit review for proposal review with Id {}",
                user_id.to_string(),
                proposal_review_id.to_string()
            )));
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
        fixtures,
        repositories::{
            MockProposalReviewCommitRepository, MockProposalReviewRepository,
            MockUserProfileRepository, ProposalReviewCommitId,
        },
    };
    use mockall::predicate::*;
    use rstest::*;
}
