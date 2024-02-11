use super::{Memory, MEMORY_MANAGER, PROPOSALS_MEMORY_ID};
use crate::repositories::{Proposal, ProposalId};
use ic_stable_structures::BTreeMap;

pub type ProposalMemory = BTreeMap<ProposalId, Proposal, Memory>;

pub fn init_proposals() -> ProposalMemory {
    ProposalMemory::init(get_proposals_memory())
}

fn get_proposals_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSALS_MEMORY_ID))
}
