use std::{borrow::Cow, ops::RangeBounds};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};

use super::{DateTime, ProposalReviewId, UserId, Uuid};

pub type ProposalReviewCommitId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct ProposalReviewCommit {
    pub proposal_review_id: Uuid,
    pub user_id: Uuid,
    pub created_at: DateTime,
    pub commit_sha: String,
    pub is_reviewed: bool,
    pub matches_description: bool,
    pub comment: Option<String>,
    pub highlights: Vec<String>,
}

impl Storable for ProposalReviewCommit {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ProposalReviewCommitProposalReviewUserKey(Blob<{ Self::MAX_SIZE as usize }>);

impl ProposalReviewCommitProposalReviewUserKey {
    const MAX_SIZE: u32 = <((ProposalReviewId, UserId), ProposalReviewCommitId)>::BOUND.max_size();

    pub fn new(
        proposal_review_id: ProposalReviewId,
        user_id: UserId,
        proposal_review_commit_id: ProposalReviewCommitId,
    ) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from(((proposal_review_id, user_id), proposal_review_commit_id).to_bytes().as_ref()).map_err(
                |_| {
                    ApiError::internal(&format!(
                        "Failed to convert proposal review id {:?}, user id {:?} and proposal review commit id {:?} to bytes.",
                        proposal_review_id, user_id, proposal_review_commit_id
                    ))
                },
            )?,
        ))
    }
}

pub struct ProposalReviewCommitProposalReviewUserRange {
    start_bound: ProposalReviewCommitProposalReviewUserKey,
    end_bound: ProposalReviewCommitProposalReviewUserKey,
}

impl ProposalReviewCommitProposalReviewUserRange {
    pub fn new(
        proposal_review_id: ProposalReviewId,
        user_id: Option<UserId>,
    ) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: ProposalReviewCommitProposalReviewUserKey::new(
                proposal_review_id,
                user_id.unwrap_or(Uuid::min()),
                Uuid::min(),
            )?,
            end_bound: ProposalReviewCommitProposalReviewUserKey::new(
                proposal_review_id,
                user_id.unwrap_or(Uuid::max()),
                Uuid::max(),
            )?,
        })
    }
}

impl RangeBounds<ProposalReviewCommitProposalReviewUserKey>
    for ProposalReviewCommitProposalReviewUserRange
{
    fn start_bound(&self) -> std::ops::Bound<&ProposalReviewCommitProposalReviewUserKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&ProposalReviewCommitProposalReviewUserKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

impl Storable for ProposalReviewCommitProposalReviewUserKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case::reviewed(fixtures::proposal_review_commit_reviewed())]
    #[case::not_reviewed(fixtures::proposal_review_commit_not_reviewed())]
    fn storable_impl(#[case] proposal_review: ProposalReviewCommit) {
        let serialized_proposal_review = proposal_review.to_bytes();
        let deserialized_proposal_review =
            ProposalReviewCommit::from_bytes(serialized_proposal_review);

        assert_eq!(proposal_review, deserialized_proposal_review);
    }

    #[rstest]
    fn proposal_review_commit_proposal_review_user_key_storable_impl() {
        let proposal_review_id = fixtures::proposal_review_id();
        let user_id = fixtures::user_id();
        let proposal_review_commit_id = fixtures::proposal_review_commit_id();

        let key = ProposalReviewCommitProposalReviewUserKey::new(
            proposal_review_id,
            user_id,
            proposal_review_commit_id,
        )
        .unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key =
            ProposalReviewCommitProposalReviewUserKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }
}
