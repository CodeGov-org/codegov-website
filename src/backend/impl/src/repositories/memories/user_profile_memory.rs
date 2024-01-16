use super::{
    memory_manager::USER_PROFILE_HISTORY_MEMORY_ID, Memory, MEMORY_MANAGER,
    USER_PROFILE_HISTORY_ID_MEMORY_ID, USER_PROFILES_MEMORY_ID,
    USER_PROFILE_PRINCIPAL_INDEX_MEMORY_ID,
};
use crate::repositories::{
    types::{UserId, UserProfile},
    UserProfileHistoryEntry, UserProfileHistoryKey,
};
use candid::Principal;
use ic_stable_structures::{BTreeMap, Cell};

pub type UserProfileMemory = BTreeMap<UserId, UserProfile, Memory>;
pub type UserProfilePrincipalIndexMemory = BTreeMap<Principal, UserId, Memory>;
pub type UserProfileHistoryMemory =
    BTreeMap<UserProfileHistoryKey, UserProfileHistoryEntry, Memory>;
pub type UserProfileHistoryIdMemory = Cell<u128, Memory>;

pub fn init_user_profiles() -> UserProfileMemory {
    UserProfileMemory::init(get_user_profiles_memory())
}

pub fn init_user_profile_principal_index() -> UserProfilePrincipalIndexMemory {
    UserProfilePrincipalIndexMemory::init(get_user_profile_principal_index_memory())
}

pub fn init_user_profiles_history() -> UserProfileHistoryMemory {
    UserProfileHistoryMemory::init(get_user_profiles_history_memory())
}

pub fn init_user_profile_history_id() -> UserProfileHistoryIdMemory {
    UserProfileHistoryIdMemory::init(get_user_profile_history_id_memory(), 0).unwrap()
}

fn get_user_profiles_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(USER_PROFILES_MEMORY_ID))
}

fn get_user_profile_principal_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(USER_PROFILE_PRINCIPAL_INDEX_MEMORY_ID))
}

fn get_user_profiles_history_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(USER_PROFILE_HISTORY_MEMORY_ID))
}

fn get_user_profile_history_id_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(USER_PROFILE_HISTORY_ID_MEMORY_ID))
}
