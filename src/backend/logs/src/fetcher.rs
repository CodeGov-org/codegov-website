use std::{
    fs::{File, OpenOptions},
    io::{Read, Seek, Write},
    path::PathBuf,
};

use candid::{Decode, Encode, Principal};
use ic_agent::{identity::Secp256k1Identity, Agent};

use backend_api::{ApiResult, ListLogsResponse, LogEntry, LogsFilterRequest};

use crate::utils::now_timestamp_ms;

struct BackendActor {
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
        let result = Decode!(&response, ApiResult<ListLogsResponse>)?;
        match result {
            ApiResult::Ok(ok) => Ok(ok),
            ApiResult::Err(err) => Err(anyhow::anyhow!(err)),
        }
    }
}

pub struct LogFetcher {
    last_fetch_timestamp: Option<u64>,
    file: File,
    actor: BackendActor,
}

impl LogFetcher {
    pub fn new(identity_pem: PathBuf, backend_canister_id: String) -> anyhow::Result<Self> {
        let path = "data/last-fetch-timestamp.txt";
        let mut file = OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(path)?;
        let mut last_fetch_timestamp = String::new();
        file.read_to_string(&mut last_fetch_timestamp)?;

        let actor = BackendActor::new(identity_pem, Principal::from_text(backend_canister_id)?)?;

        Ok(Self {
            file,
            last_fetch_timestamp: last_fetch_timestamp.trim().parse().ok(),
            actor,
        })
    }

    pub async fn fetch_logs(&mut self) -> anyhow::Result<Vec<LogEntry>> {
        let logs = self.actor.list_logs(self.last_fetch_timestamp).await?;
        let now = now_timestamp_ms();
        self.update_last_fetch_timestamp(now);
        Ok(logs.logs)
    }

    fn update_last_fetch_timestamp(&mut self, timestamp: u64) {
        self.last_fetch_timestamp = Some(timestamp);
        self.file.set_len(0).unwrap();
        self.file.rewind().unwrap();
        self.file
            .write_all(timestamp.to_string().as_bytes())
            .unwrap();
    }
}
