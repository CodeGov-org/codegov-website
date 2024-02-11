use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::DefaultMemoryImpl;
use std::cell::RefCell;

pub(super) type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
}

// memory IDs are kept together to ensure that the same ID is not used more than once
// everything else related to each memory region is kept in the appropriate file
pub(super) const USER_PROFILES_MEMORY_ID: MemoryId = MemoryId::new(0);
pub(super) const USER_PROFILE_PRINCIPAL_INDEX_MEMORY_ID: MemoryId = MemoryId::new(1);
pub(super) const USER_PROFILE_HISTORY_MEMORY_ID: MemoryId = MemoryId::new(2);
pub(super) const USER_PROFILE_HISTORY_ID_MEMORY_ID: MemoryId = MemoryId::new(3);
pub(super) const PROPOSALS_MEMORY_ID: MemoryId = MemoryId::new(4);
pub(super) const LOGS_INDEX_MEMORY_ID: MemoryId = MemoryId::new(5);
pub(super) const LOGS_MEMORY_ID: MemoryId = MemoryId::new(6);
pub(super) const PROPOSALS_SORTED_INDEX_MEMORY_ID: MemoryId = MemoryId::new(7);
