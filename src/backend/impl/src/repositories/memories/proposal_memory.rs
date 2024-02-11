use super::{Memory, MEMORY_MANAGER, PROPOSALS_MEMORY_ID, PROPOSALS_SORTED_INDEX_MEMORY_ID};
use crate::repositories::{Proposal, ProposalId, ProposalIndex};
use ic_stable_structures::BTreeMap;

pub type ProposalMemory = BTreeMap<ProposalId, Proposal, Memory>;
pub type ProposalSortedIndexMemory = BTreeMap<ProposalIndex, (), Memory>;

pub fn init_proposals() -> ProposalMemory {
    ProposalMemory::init(get_proposals_memory())
}

pub fn init_proposals_sorted_index() -> ProposalSortedIndexMemory {
    ProposalSortedIndexMemory::init(get_proposals_sorted_index_memory())
}

fn get_proposals_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSALS_MEMORY_ID))
}

fn get_proposals_sorted_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSALS_SORTED_INDEX_MEMORY_ID))
}
