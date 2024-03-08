use super::{
    Memory, MEMORY_MANAGER, PROPOSALS_MEMORY_ID, PROPOSALS_STATUS_TIMESTAMP_INDEX_MEMORY_ID,
};
use crate::repositories::{Proposal, ProposalId, ProposalStatusTimestampKey};
use ic_stable_structures::BTreeMap;

pub type ProposalMemory = BTreeMap<ProposalId, Proposal, Memory>;
pub type ProposalStatusTimestampIndexMemory =
    BTreeMap<ProposalStatusTimestampKey, ProposalId, Memory>;

pub fn init_proposals() -> ProposalMemory {
    ProposalMemory::init(get_proposals_memory())
}

pub fn init_proposals_status_timestamp_index() -> ProposalStatusTimestampIndexMemory {
    ProposalStatusTimestampIndexMemory::init(get_proposals_status_timestamp_index_memory())
}

fn get_proposals_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSALS_MEMORY_ID))
}

fn get_proposals_status_timestamp_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSALS_STATUS_TIMESTAMP_INDEX_MEMORY_ID))
}
