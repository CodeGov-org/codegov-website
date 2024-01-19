use candid::{CandidType, Deserialize, Principal};

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum HistoryAction {
    #[serde(rename = "create")]
    Create,
    #[serde(rename = "update")]
    Update,
    #[serde(rename = "delete")]
    Delete,
    #[serde(rename = "restore")]
    Restore,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct HistoryEntry<T> {
    pub action: HistoryAction,
    pub date_time: String,
    pub user: Principal,
    pub data: T,
}
