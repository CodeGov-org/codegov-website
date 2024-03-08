use std::{borrow::Cow, ops::RangeBounds};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};

use super::{DateTime, ProposalId, UserId, Uuid};

pub type ProposalReviewId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ProposalReviewStatus {
    Draft,
    Published,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct ProposalReview {
    pub proposal_id: ProposalId,
    pub user_id: UserId,
    pub created_at: DateTime,
    pub status: ProposalReviewStatus,
    pub summary: String,
    pub review_duration_mins: u16,
    pub build_reproduced: bool,
    pub reproduced_build_image_id: Option<Uuid>,
}

impl Storable for ProposalReview {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ProposalReviewProposalKey(Blob<{ Self::MAX_SIZE as usize }>);

impl ProposalReviewProposalKey {
    const MAX_SIZE: u32 = <(ProposalId, ProposalReviewId)>::BOUND.max_size();

    pub fn new(
        proposal_id: ProposalId,
        proposal_review_id: ProposalReviewId,
    ) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from((proposal_id, proposal_review_id).to_bytes().as_ref()).map_err(
                |_| {
                    ApiError::internal(&format!(
                        "Failed to convert proposal id {:?} and proposal review id {:?} to bytes.",
                        proposal_id, proposal_review_id
                    ))
                },
            )?,
        ))
    }
}

impl Storable for ProposalReviewProposalKey {
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

pub struct ProposalReviewProposalRange {
    start_bound: ProposalReviewProposalKey,
    end_bound: ProposalReviewProposalKey,
}

impl ProposalReviewProposalRange {
    pub fn new(proposal_id: ProposalId) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: ProposalReviewProposalKey::new(proposal_id, Uuid::min())?,
            end_bound: ProposalReviewProposalKey::new(proposal_id, Uuid::max())?,
        })
    }
}

impl RangeBounds<ProposalReviewProposalKey> for ProposalReviewProposalRange {
    fn start_bound(&self) -> std::ops::Bound<&ProposalReviewProposalKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&ProposalReviewProposalKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ProposalReviewUserKey(Blob<{ Self::MAX_SIZE as usize }>);

impl ProposalReviewUserKey {
    const MAX_SIZE: u32 = <(UserId, ProposalReviewId)>::BOUND.max_size();

    pub fn new(user_id: UserId, proposal_review_id: ProposalReviewId) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from((user_id, proposal_review_id).to_bytes().as_ref()).map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to convert user id {:?} and proposal review id {:?} to bytes.",
                    user_id, proposal_review_id
                ))
            })?,
        ))
    }
}

impl Storable for ProposalReviewUserKey {
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

pub struct ProposalReviewUserRange {
    start_bound: ProposalReviewUserKey,
    end_bound: ProposalReviewUserKey,
}

impl ProposalReviewUserRange {
    pub fn new(user_id: UserId) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: ProposalReviewUserKey::new(user_id, Uuid::min())?,
            end_bound: ProposalReviewUserKey::new(user_id, Uuid::max())?,
        })
    }
}

impl RangeBounds<ProposalReviewUserKey> for ProposalReviewUserRange {
    fn start_bound(&self) -> std::ops::Bound<&ProposalReviewUserKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&ProposalReviewUserKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case::proposal_review_draft(fixtures::proposal_review_draft())]
    #[case::proposal_review_published(fixtures::proposal_review_published())]
    fn storable_impl(#[case] proposal_review: ProposalReview) {
        let serialized_proposal_review = proposal_review.to_bytes();
        let deserialized_proposal_review = ProposalReview::from_bytes(serialized_proposal_review);

        assert_eq!(proposal_review, deserialized_proposal_review);
    }

    #[rstest]
    fn proposal_review_proposal_key_storable_impl() {
        let proposal_id = fixtures::proposal_id();
        let proposal_review_id = fixtures::proposal_review_id();

        let key = ProposalReviewProposalKey::new(proposal_id, proposal_review_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = ProposalReviewProposalKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    fn proposal_review_user_key_storable_impl() {
        let user_id = fixtures::user_id();
        let proposal_review_id = fixtures::proposal_review_id();

        let key = ProposalReviewUserKey::new(user_id, proposal_review_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = ProposalReviewUserKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }
}
