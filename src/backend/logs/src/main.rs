use std::{collections::HashMap, path::PathBuf};

use backend_api::{LogEntry, LogLevel};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use clap::Parser;
use opentelemetry::{
    logs::{AnyValue, Logger as _, LoggerProvider as _, Severity},
    KeyValue,
};
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::{
    logs::{LogRecord, Logger, LoggerProvider},
    Resource,
};

mod fetcher;
mod utils;

use fetcher::LogFetcher;
use utils::now;

fn init_telemetry(args: &Args) -> anyhow::Result<LoggerProvider> {
    let headers = {
        let mut headers = HashMap::new();
        let auth_header = format!(
            "Basic {}",
            BASE64.encode(format!("{}:{}", args.loki_username, args.loki_password))
        );
        headers.insert("Authorization".to_string(), auth_header.parse().unwrap());
        headers
    };
    // from https://grafana.com/docs/loki/latest/reference/loki-http-api/#ingest-logs-using-otlp
    let loki_endpoint = format!("{}/otlp/v1/logs", args.loki_endpoint);
    let exporter = opentelemetry_otlp::new_exporter()
        .http()
        .with_endpoint(loki_endpoint)
        .with_headers(headers)
        .build_log_exporter()?;

    let logger_provider = LoggerProvider::builder()
        .with_simple_exporter(exporter)
        .with_resource(Resource::new(vec![
            KeyValue::new(
                opentelemetry_semantic_conventions::resource::SERVICE_NAME,
                "backend_canister",
            ),
            KeyValue::new("canister_id", args.backend_canister_id.clone()),
        ]))
        .build();

    Ok(logger_provider)
}

fn build_logger(provider: &LoggerProvider) -> Logger {
    provider.logger_builder("backend_canister_logger").build()
}

struct LogEntryAdapter(LogEntry);

impl TryInto<LogRecord> for LogEntryAdapter {
    type Error = anyhow::Error;

    fn try_into(self) -> Result<LogRecord, Self::Error> {
        let mut log_record = LogRecord::default();
        log_record.timestamp =
            Some(chrono::DateTime::parse_from_rfc3339(&self.0.date_time)?.into());
        log_record.observed_timestamp = Some(now());
        log_record.severity_number = Some(match self.0.level {
            LogLevel::Info => Severity::Info,
            LogLevel::Warn => Severity::Warn,
            LogLevel::Error => Severity::Error,
        });
        let mut body = HashMap::new();
        body.insert("message".into(), self.0.message.into());
        if let Some(context) = self.0.context {
            body.insert("context".into(), context.into());
        }
        log_record.body = Some(AnyValue::Map(Box::new(body)));

        Ok(log_record)
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
    let logger_provider = init_telemetry(&args)?;
    let logger = build_logger(&logger_provider);

    let mut log_fetcher = LogFetcher::new(args.identity_pem, args.backend_canister_id)?;

    let logs = log_fetcher.fetch_logs().await?;
    println!("Sending {} logs to Loki...", logs.len());
    for log in logs {
        let log_entry = LogEntryAdapter(log);
        logger.emit(log_entry.try_into()?);
    }
    println!("Logs sent to Loki");

    Ok(())
}
