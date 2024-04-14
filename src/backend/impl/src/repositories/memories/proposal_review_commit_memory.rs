use ic_stable_structures::BTreeMap;

use crate::repositories::{
    ProposalReviewCommit, ProposalReviewCommitId, ProposalReviewCommitProposalReviewUserKey,
};

use super::{
    Memory, MEMORY_MANAGER, PROPOSAL_REVIEW_COMMITS_MEMORY_ID,
    PROPOSAL_REVIEW_COMMIT_PROPOSAL_REVIEW_ID_USER_ID_MEMORY_ID,
};

pub type ProposalReviewCommitMemory =
    BTreeMap<ProposalReviewCommitId, ProposalReviewCommit, Memory>;
pub type ProposalReviewCommitProposalReviewIdUserIdIndexMemory =
    BTreeMap<ProposalReviewCommitProposalReviewUserKey, ProposalReviewCommitId, Memory>;

pub fn init_proposal_review_commits() -> ProposalReviewCommitMemory {
    ProposalReviewCommitMemory::init(get_proposal_review_commit_memory())
}

pub fn init_proposal_review_commit_proposal_review_id_user_id_index(
) -> ProposalReviewCommitProposalReviewIdUserIdIndexMemory {
    ProposalReviewCommitProposalReviewIdUserIdIndexMemory::init(
        get_proposal_review_commit_proposal_review_id_user_id_index_memory(),
    )
}

fn get_proposal_review_commit_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSAL_REVIEW_COMMITS_MEMORY_ID))
}

fn get_proposal_review_commit_proposal_review_id_user_id_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| {
        m.borrow()
            .get(PROPOSAL_REVIEW_COMMIT_PROPOSAL_REVIEW_ID_USER_ID_MEMORY_ID)
    })
}
