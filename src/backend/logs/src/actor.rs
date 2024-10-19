use std::path::PathBuf;

use candid::{Decode, Encode, Principal};
use ic_agent::{identity::Secp256k1Identity, Agent};

use crate::backend::{ListLogsResponse, LogsFilterRequest};

pub struct BackendActor {
    agent: Agent,
    canister_id: Principal,
}

impl BackendActor {
    pub fn new(identity_pem: PathBuf, canister_id: Principal) -> anyhow::Result<Self> {
        let identity = Secp256k1Identity::from_pem_file(identity_pem)?;
        let agent = Agent::builder()
            .with_identity(identity)
            .with_url("https://icp-api.io")
            .build()?;
        Ok(Self { agent, canister_id })
    }

    pub async fn list_logs(
        &self,
        after_timestamp_ms: Option<u64>,
    ) -> Result<ListLogsResponse, anyhow::Error> {
        let request = LogsFilterRequest {
            after_timestamp_ms,
            before_timestamp_ms: None,
            context_contains_any: None,
            level: None,
            message_contains_any: None,
        };
        let response = self
            .agent
            .query(&self.canister_id, "list_logs")
            .with_arg(Encode!(&request)?)
            .await?;
        let result = Decode!(&response, ListLogsResponse)?;
        Ok(result)
    }
}
