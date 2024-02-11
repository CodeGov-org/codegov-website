use std::cell::RefCell;

use backend_api::ApiError;

use super::{
    init_proposal_review_proposal_id_index, init_proposal_reviews, ProposalId, ProposalReview,
    ProposalReviewId, ProposalReviewMemory, ProposalReviewProposalIdIndexMemory,
    ProposalReviewProposalKey, ProposalReviewProposalRange,
};

#[cfg_attr(test, mockall::automock)]
pub trait ProposalReviewRepository {
    fn get_proposal_review_by_id(
        &self,
        proposal_review_id: &ProposalReviewId,
    ) -> Option<ProposalReview>;

    fn get_proposal_reviews_by_proposal_id(
        &self,
        proposal_id: ProposalId,
    ) -> Vec<(ProposalReviewId, ProposalReview)>;

    async fn create_proposal_review(
        &self,
        proposal_review: ProposalReview,
    ) -> Result<ProposalReviewId, ApiError>;

    fn update_proposal_review(
        &self,
        proposal_review_id: &ProposalReviewId,
        proposal_review: ProposalReview,
    ) -> Result<(), ApiError>;
}

pub struct ProposalReviewRepositoryImpl {}

impl Default for ProposalReviewRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl ProposalReviewRepository for ProposalReviewRepositoryImpl {
    fn get_proposal_review_by_id(
        &self,
        proposal_review_id: &ProposalReviewId,
    ) -> Option<ProposalReview> {
        STATE.with_borrow(|s| s.proposal_reviews.get(proposal_review_id))
    }

    fn get_proposal_reviews_by_proposal_id(
        &self,
        proposal_id: ProposalId,
    ) -> Vec<(ProposalReviewId, ProposalReview)> {
        STATE.with_borrow(|s| {
            s.proposal_id_index
                .range(ProposalReviewProposalRange::new(proposal_id))
                .filter_map(|(k, _)| {
                    let proposal_review_id = k.proposal_review_id();

                    // the None case in this get should never happen
                    s.proposal_reviews
                        .get(&proposal_review_id)
                        .map(|p_r| (proposal_review_id, p_r))
                })
                .collect()
        })
    }

    async fn create_proposal_review(
        &self,
        proposal_review: ProposalReview,
    ) -> Result<ProposalReviewId, ApiError> {
        let proposal_review_id = ProposalReviewId::new().await?;

        STATE.with_borrow_mut(|s| {
            s.proposal_reviews
                .insert(proposal_review_id, proposal_review.clone());
            s.proposal_id_index.insert(
                ProposalReviewProposalKey::new(proposal_review.proposal_id, proposal_review_id),
                (),
            );
        });

        Ok(proposal_review_id)
    }

    fn update_proposal_review(
        &self,
        proposal_review_id: &ProposalReviewId,
        proposal_review: ProposalReview,
    ) -> Result<(), ApiError> {
        self.get_proposal_review_by_id(proposal_review_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Proposal review with id {} not found",
                    proposal_review_id.to_string()
                ))
            })?;

        STATE.with_borrow_mut(|s| {
            s.proposal_reviews
                .insert(*proposal_review_id, proposal_review);

            Ok(())
        })
    }
}

impl ProposalReviewRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct ProposalReviewState {
    proposal_reviews: ProposalReviewMemory,
    proposal_id_index: ProposalReviewProposalIdIndexMemory,
}

impl Default for ProposalReviewState {
    fn default() -> Self {
        Self {
            proposal_reviews: init_proposal_reviews(),
            proposal_id_index: init_proposal_review_proposal_id_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<ProposalReviewState> = RefCell::new(ProposalReviewState::default());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures::{self, uuid_a, uuid_b},
        repositories::ProposalReviewStatus,
    };
    use rstest::*;

    #[rstest]
    #[case::proposal_review_draft(fixtures::proposal_review_draft())]
    #[case::proposal_review_published(fixtures::proposal_review_published())]
    async fn create_and_get_proposal_review_by_id(#[case] proposal_review: ProposalReview) {
        STATE.set(ProposalReviewState::default());

        let repository = ProposalReviewRepositoryImpl::default();
        let proposal_review_id = repository
            .create_proposal_review(proposal_review.clone())
            .await
            .unwrap();

        let result = repository.get_proposal_review_by_id(&proposal_review_id);

        assert_eq!(result, Some(proposal_review));
    }

    #[rstest]
    async fn get_proposal_reviews_by_proposal_id() {
        STATE.set(ProposalReviewState::default());

        let proposal_reviews = proposal_reviews();

        let repository = ProposalReviewRepositoryImpl::default();

        for proposal_review in proposal_reviews {
            repository
                .create_proposal_review(proposal_review.clone())
                .await
                .unwrap();
        }

        let result = repository.get_proposal_reviews_by_proposal_id(uuid_a());
        let result = result.into_iter().map(|(_, p_r)| p_r).collect::<Vec<_>>();

        assert_eq!(
            result,
            vec![
                ProposalReview {
                    proposal_id: uuid_a(),
                    ..fixtures::proposal_review_draft()
                },
                ProposalReview {
                    proposal_id: uuid_a(),
                    ..fixtures::proposal_review_published()
                },
            ]
        );
    }

    #[rstest]
    async fn update_proposal_review() {
        STATE.set(ProposalReviewState::default());

        let original_proposal_review = fixtures::proposal_review_draft();
        let updated_proposal_review = updated_proposal_review();

        let repository = ProposalReviewRepositoryImpl::default();
        let proposal_review_id = repository
            .create_proposal_review(original_proposal_review)
            .await
            .unwrap();

        repository
            .update_proposal_review(&proposal_review_id, updated_proposal_review.clone())
            .unwrap();

        let result = repository
            .get_proposal_review_by_id(&proposal_review_id)
            .unwrap();

        assert_eq!(result, updated_proposal_review);
    }

    #[fixture]
    fn proposal_reviews() -> Vec<ProposalReview> {
        vec![
            ProposalReview {
                proposal_id: uuid_a(),
                ..fixtures::proposal_review_draft()
            },
            ProposalReview {
                proposal_id: uuid_a(),
                ..fixtures::proposal_review_published()
            },
            ProposalReview {
                proposal_id: uuid_b(),
                ..fixtures::proposal_review_draft()
            },
            ProposalReview {
                proposal_id: uuid_b(),
                ..fixtures::proposal_review_published()
            },
        ]
    }

    #[fixture]
    fn updated_proposal_review() -> ProposalReview {
        ProposalReview {
            status: ProposalReviewStatus::Draft,
            ..fixtures::proposal_review_draft()
        }
    }
}
