use std::cell::RefCell;

use backend_api::ApiError;

use super::{
    init_proposal_review_commit_proposal_review_id_user_id_index, init_proposal_review_commits,
    ProposalReviewCommit, ProposalReviewCommitId, ProposalReviewCommitMemory,
    ProposalReviewCommitProposalReviewIdUserIdIndexMemory,
    ProposalReviewCommitProposalReviewUserKey, ProposalReviewCommitProposalReviewUserRange,
    ProposalReviewId,
};

#[cfg_attr(test, mockall::automock)]
pub trait ProposalReviewCommitRepository {
    fn get_proposal_review_commit_by_id(
        &self,
        proposal_review_commit_id: &ProposalReviewCommitId,
    ) -> Option<ProposalReviewCommit>;

    fn get_proposal_review_commits_by_proposal_review_id(
        &self,
        proposal_review_id: ProposalReviewId,
    ) -> Result<Vec<(ProposalReviewCommitId, ProposalReviewCommit)>, ApiError>;

    async fn create_proposal_review_commit(
        &self,
        proposal_review_commit: ProposalReviewCommit,
    ) -> Result<ProposalReviewCommitId, ApiError>;

    fn update_proposal_review_commit(
        &self,
        proposal_review_commit_id: ProposalReviewCommitId,
        proposal_review_commit: ProposalReviewCommit,
    ) -> Result<(), ApiError>;
}

pub struct ProposalReviewCommitRepositoryImpl {}

impl Default for ProposalReviewCommitRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl ProposalReviewCommitRepository for ProposalReviewCommitRepositoryImpl {
    fn get_proposal_review_commit_by_id(
        &self,
        proposal_review_commit_id: &ProposalReviewCommitId,
    ) -> Option<ProposalReviewCommit> {
        STATE.with_borrow(|s| s.proposal_review_commits.get(proposal_review_commit_id))
    }

    fn get_proposal_review_commits_by_proposal_review_id(
        &self,
        proposal_review_id: ProposalReviewId,
    ) -> Result<Vec<(ProposalReviewCommitId, ProposalReviewCommit)>, ApiError> {
        let range = ProposalReviewCommitProposalReviewUserRange::new(proposal_review_id)?;

        let proposal_review_commits = STATE.with_borrow(|s| {
            s.proposal_review_id_user_id_index
                .range(range)
                .filter_map(|(_, proposal_review_commit_id)| {
                    s.proposal_review_commits
                        .get(&proposal_review_commit_id)
                        .map(|el| (proposal_review_commit_id, el))
                })
                .collect()
        });

        Ok(proposal_review_commits)
    }

    async fn create_proposal_review_commit(
        &self,
        proposal_review_commit: ProposalReviewCommit,
    ) -> Result<ProposalReviewCommitId, ApiError> {
        let proposal_review_commit_id = ProposalReviewCommitId::new().await?;
        let proposal_review_user_key = ProposalReviewCommitProposalReviewUserKey::new(
            proposal_review_commit.proposal_review_id,
            proposal_review_commit_id,
        )?;

        STATE.with_borrow_mut(|s| {
            s.proposal_review_commits
                .insert(proposal_review_commit_id, proposal_review_commit);
            s.proposal_review_id_user_id_index
                .insert(proposal_review_user_key, proposal_review_commit_id);
        });

        Ok(proposal_review_commit_id)
    }

    fn update_proposal_review_commit(
        &self,
        proposal_review_commit_id: ProposalReviewCommitId,
        proposal_review_commit: ProposalReviewCommit,
    ) -> Result<(), ApiError> {
        self.get_proposal_review_commit_by_id(&proposal_review_commit_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Proposal review commit with id {} not found",
                    proposal_review_commit_id.to_string()
                ))
            })?;

        STATE.with_borrow_mut(|s| {
            s.proposal_review_commits
                .insert(proposal_review_commit_id, proposal_review_commit);
        });

        Ok(())
    }
}

impl ProposalReviewCommitRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct ProposalReviewCommitState {
    proposal_review_commits: ProposalReviewCommitMemory,
    proposal_review_id_user_id_index: ProposalReviewCommitProposalReviewIdUserIdIndexMemory,
}

impl Default for ProposalReviewCommitState {
    fn default() -> Self {
        Self {
            proposal_review_commits: init_proposal_review_commits(),
            proposal_review_id_user_id_index:
                init_proposal_review_commit_proposal_review_id_user_id_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<ProposalReviewCommitState> = RefCell::new(ProposalReviewCommitState::default());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures::{self, uuid_a, uuid_b};
    use rstest::*;

    #[rstest]
    #[case::reviewed(fixtures::proposal_review_commit_reviewed())]
    #[case::not_reviewed(fixtures::proposal_review_commit_not_reviewed())]
    async fn create_and_get_proposal_review_by_id(
        #[case] proposal_review_commit: ProposalReviewCommit,
    ) {
        STATE.set(ProposalReviewCommitState::default());

        let repository = ProposalReviewCommitRepositoryImpl::default();
        let proposal_review_id = repository
            .create_proposal_review_commit(proposal_review_commit.clone())
            .await
            .unwrap();

        let result = repository.get_proposal_review_commit_by_id(&proposal_review_id);

        assert_eq!(result, Some(proposal_review_commit));
    }

    #[rstest]
    async fn get_proposal_review_commits_by_proposal_review_id() {
        STATE.set(ProposalReviewCommitState::default());

        let proposal_review_commits = proposal_review_commits_fixed_proposal_review_id();

        let repository = ProposalReviewCommitRepositoryImpl::default();

        for proposal_review_commit in proposal_review_commits {
            repository
                .create_proposal_review_commit(proposal_review_commit)
                .await
                .unwrap();
        }

        let result = repository
            .get_proposal_review_commits_by_proposal_review_id(uuid_a())
            .unwrap();
        let filtered_proposal_review_commits = result
            .into_iter()
            .map(|(_, p_r_c)| p_r_c)
            .collect::<Vec<_>>();

        assert_eq!(
            filtered_proposal_review_commits,
            vec![
                ProposalReviewCommit {
                    proposal_review_id: uuid_a(),
                    ..fixtures::proposal_review_commit_reviewed()
                },
                ProposalReviewCommit {
                    proposal_review_id: uuid_a(),
                    ..fixtures::proposal_review_commit_not_reviewed()
                },
            ]
        );
    }

    #[rstest]
    async fn update_proposal_review_commit() {
        STATE.set(ProposalReviewCommitState::default());

        let original_proposal_review_commit = fixtures::proposal_review_commit_not_reviewed();
        let updated_proposal_review_commit = updated_proposal_review_commit();

        let repository = ProposalReviewCommitRepositoryImpl::default();
        let proposal_review_commit_id = repository
            .create_proposal_review_commit(original_proposal_review_commit)
            .await
            .unwrap();

        repository
            .update_proposal_review_commit(
                proposal_review_commit_id,
                updated_proposal_review_commit.clone(),
            )
            .unwrap();

        let result = repository
            .get_proposal_review_commit_by_id(&proposal_review_commit_id)
            .unwrap();

        assert_eq!(result, updated_proposal_review_commit);
    }

    #[fixture]
    fn proposal_review_commits_fixed_proposal_review_id() -> Vec<ProposalReviewCommit> {
        vec![
            ProposalReviewCommit {
                proposal_review_id: uuid_a(),
                ..fixtures::proposal_review_commit_reviewed()
            },
            ProposalReviewCommit {
                proposal_review_id: uuid_a(),
                ..fixtures::proposal_review_commit_not_reviewed()
            },
            ProposalReviewCommit {
                proposal_review_id: uuid_b(),
                ..fixtures::proposal_review_commit_reviewed()
            },
            ProposalReviewCommit {
                proposal_review_id: uuid_b(),
                ..fixtures::proposal_review_commit_not_reviewed()
            },
        ]
    }

    #[fixture]
    fn updated_proposal_review_commit() -> ProposalReviewCommit {
        ProposalReviewCommit {
            is_reviewed: true,
            ..fixtures::proposal_review_commit_not_reviewed()
        }
    }
}
