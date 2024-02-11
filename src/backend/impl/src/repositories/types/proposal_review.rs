use std::{borrow::Cow, ops::RangeBounds};

use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};

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
    pub build_image_bytes: Option<Vec<u8>>,
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

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ProposalReviewProposalKey {
    proposal_id: ProposalId,
    proposal_review_id: ProposalReviewId,
}

impl ProposalReviewProposalKey {
    pub fn new(proposal_id: ProposalId, proposal_review_id: ProposalReviewId) -> Self {
        Self {
            proposal_id,
            proposal_review_id,
        }
    }

    pub fn proposal_review_id(&self) -> ProposalReviewId {
        self.proposal_review_id
    }
}

pub struct ProposalReviewProposalRange {
    start_bound: ProposalReviewProposalKey,
    end_bound: ProposalReviewProposalKey,
}

impl ProposalReviewProposalRange {
    pub fn new(proposal_id: ProposalId) -> Self {
        Self {
            start_bound: ProposalReviewProposalKey::new(proposal_id, ProposalReviewId::min()),
            end_bound: ProposalReviewProposalKey::new(proposal_id, ProposalReviewId::max()),
        }
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

impl Storable for ProposalReviewProposalKey {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    // TODO: should be bounded
    const BOUND: Bound = Bound::Unbounded;
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
}
