use super::{
    Memory, MEMORY_MANAGER, PROPOSALS_MEMORY_ID, PROPOSALS_STATUS_TIMESTAMP_INDEX_MEMORY_ID,
    PROPOSAL_NERVOUS_SYSTEM_ID_INDEX_MEMORY_ID, PROPOSAL_TIMESTAMP_INDEX_MEMORY_ID,
};
use crate::repositories::{
    Proposal, ProposalId, ProposalNervousSystemIdKey, ProposalStatusTimestampKey,
    ProposalTimestampKey,
};
use ic_stable_structures::BTreeMap;

pub type ProposalMemory = BTreeMap<ProposalId, Proposal, Memory>;
pub type ProposalStatusTimestampIndexMemory =
    BTreeMap<ProposalStatusTimestampKey, ProposalId, Memory>;
pub type ProposalNervousSystemIdIndexMemory =
    BTreeMap<ProposalNervousSystemIdKey, ProposalId, Memory>;
pub type ProposalTimestampIndexMemory = BTreeMap<ProposalTimestampKey, ProposalId, Memory>;

pub fn init_proposals() -> ProposalMemory {
    ProposalMemory::init(get_proposals_memory())
}

pub fn init_proposals_status_timestamp_index() -> ProposalStatusTimestampIndexMemory {
    ProposalStatusTimestampIndexMemory::init(get_proposals_status_timestamp_index_memory())
}

pub fn init_proposals_nervous_system_id_index() -> ProposalNervousSystemIdIndexMemory {
    ProposalNervousSystemIdIndexMemory::init(get_proposal_nervous_system_id_index_memory())
}

pub fn init_proposal_timestamp_index() -> ProposalTimestampIndexMemory {
    ProposalTimestampIndexMemory::init(get_proposal_timestamp_index_memory())
}

fn get_proposals_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSALS_MEMORY_ID))
}

fn get_proposals_status_timestamp_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSALS_STATUS_TIMESTAMP_INDEX_MEMORY_ID))
}

fn get_proposal_nervous_system_id_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSAL_NERVOUS_SYSTEM_ID_INDEX_MEMORY_ID))
}

fn get_proposal_timestamp_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSAL_TIMESTAMP_INDEX_MEMORY_ID))
}
