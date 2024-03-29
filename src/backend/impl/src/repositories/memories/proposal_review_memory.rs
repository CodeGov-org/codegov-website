use ic_stable_structures::BTreeMap;

use crate::repositories::{
    ProposalReview, ProposalReviewId, ProposalReviewProposalUserKey, ProposalReviewUserKey,
};

use super::{
    Memory, MEMORY_MANAGER, PROPOSAL_REVIEWS_MEMORY_ID,
    PROPOSAL_REVIEWS_PROPOSAL_ID_USER_ID_INDEX_MEMORY_ID, PROPOSAL_REVIEWS_USER_ID_INDEX_MEMORY_ID,
};

pub type ProposalReviewMemory = BTreeMap<ProposalReviewId, ProposalReview, Memory>;
pub type ProposalReviewProposalIdUserIdIndexMemory =
    BTreeMap<ProposalReviewProposalUserKey, ProposalReviewId, Memory>;
pub type ProposalReviewUserIdIndexMemory =
    BTreeMap<ProposalReviewUserKey, ProposalReviewId, Memory>;

pub fn init_proposal_reviews() -> ProposalReviewMemory {
    ProposalReviewMemory::init(get_proposal_reviews_memory())
}

pub fn init_proposal_review_proposal_id_user_id_index() -> ProposalReviewProposalIdUserIdIndexMemory
{
    ProposalReviewProposalIdUserIdIndexMemory::init(
        get_proposal_review_proposal_id_user_id_index_memory(),
    )
}

pub fn init_proposal_review_user_id_index() -> ProposalReviewUserIdIndexMemory {
    ProposalReviewUserIdIndexMemory::init(get_proposal_review_user_id_index_memory())
}

fn get_proposal_reviews_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSAL_REVIEWS_MEMORY_ID))
}

fn get_proposal_review_proposal_id_user_id_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| {
        m.borrow()
            .get(PROPOSAL_REVIEWS_PROPOSAL_ID_USER_ID_INDEX_MEMORY_ID)
    })
}

fn get_proposal_review_user_id_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSAL_REVIEWS_USER_ID_INDEX_MEMORY_ID))
}
