use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use candid::Principal;
use clap::Parser;
use opentelemetry::logs::{AnyValue, Logger as _, LoggerProvider as _, Severity};
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::logs::{Logger, LoggerProvider};
use std::collections::HashMap;
use std::{
    fs::{File, OpenOptions},
    io::{Read, Seek, Write},
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

mod actor;
mod backend;

use actor::BackendActor;
use backend::{ListLogsResponse, LogEntry, LogLevel};

fn now() -> SystemTime {
    SystemTime::now()
}

fn now_timestamp_ms() -> u64 {
    now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64
}

fn loki_headers(username: String, password: String) -> HashMap<String, String> {
    let mut headers = HashMap::new();
    let auth_header = format!(
        "Basic {}",
        BASE64.encode(format!("{}:{}", username, password))
    );
    headers.insert("Authorization".to_string(), auth_header.parse().unwrap());
    headers
}

fn init_telemetry(
    endpoint: String,
    username: String,
    password: String,
) -> anyhow::Result<LoggerProvider> {
    let headers = loki_headers(username, password);
    let exporter = opentelemetry_otlp::new_exporter()
        .http()
        .with_endpoint(endpoint)
        .with_headers(headers)
        .build_log_exporter()?;

    let logger_provider = LoggerProvider::builder()
        .with_simple_exporter(exporter)
        .build();

    Ok(logger_provider)
}

fn build_logger(provider: &LoggerProvider) -> Logger {
    provider.logger_builder("backend_canister_logger").build()
}

struct LogFetcher {
    last_fetch_timestamp: Option<u64>,
    file: File,
    actor: BackendActor,
}

impl LogFetcher {
    fn new(identity_pem: PathBuf, backend_canister_id: String) -> anyhow::Result<Self> {
        let path = "data/last-fetch-timestamp.txt";
        let mut file = OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(path)?;
        let mut last_fetch_timestamp = String::new();
        file.read_to_string(&mut last_fetch_timestamp)?;

        let actor = BackendActor::new(identity_pem, Principal::from_text(&backend_canister_id)?)?;

        Ok(Self {
            file,
            last_fetch_timestamp: last_fetch_timestamp.trim().parse().ok(),
            actor,
        })
    }

    async fn fetch_logs(&mut self) -> anyhow::Result<Vec<LogEntry>> {
        let logs = self.actor.list_logs(self.last_fetch_timestamp).await?;
        let now = now_timestamp_ms();
        self.update_last_fetch_timestamp(now);
        match logs {
            ListLogsResponse::Ok { logs } => Ok(logs),
            ListLogsResponse::Err(err) => Err(anyhow::anyhow!(err.message)),
        }
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

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the identity PEM file
    #[arg(long, value_name = "FILE")]
    identity_pem: PathBuf,

    /// Loki endpoint URL
    #[arg(long, value_name = "URL")]
    loki_endpoint: String,

    /// Loki username
    #[arg(long)]
    loki_username: String,

    /// Loki password
    #[arg(long)]
    loki_password: String,

    /// Backend canister ID
    #[arg(long, value_name = "CANISTER_ID")]
    backend_canister_id: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    // we need to keep the logger provider in memory because the drop implementation shuts down the processors
    let logger_provider =
        init_telemetry(args.loki_endpoint, args.loki_username, args.loki_password)?;
    let logger = build_logger(&logger_provider);

    let mut log_fetcher = LogFetcher::new(args.identity_pem, args.backend_canister_id)?;
    let logs = log_fetcher.fetch_logs().await?;

    println!("Sending {} logs to Loki...", logs.len());

    for log in logs {
        let mut log_record = logger.create_log_record();
        log_record.timestamp = Some(chrono::DateTime::parse_from_rfc3339(&log.date_time)?.into());
        log_record.observed_timestamp = Some(now());
        log_record.severity_number = Some(match log.level {
            LogLevel::Info => Severity::Info,
            LogLevel::Warn => Severity::Warn,
            LogLevel::Error => Severity::Error,
        });
        let mut body = HashMap::new();
        body.insert("message".into(), log.message.into());
        if let Some(context) = log.context {
            body.insert("context".into(), context.into());
        }
        log_record.body = Some(AnyValue::Map(Box::new(body)));

        logger.emit(log_record);
    }

    println!("Logs sent to Loki");

    Ok(())
}
