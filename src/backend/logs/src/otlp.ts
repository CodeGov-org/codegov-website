import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs';
import { Logger } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http/build/esnext';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// `2048` is the default batch size for the OTLP logs batch processor.
// We use `2048 * 4` to accommodate cases where we fetch a lot of logs at once.
const LOGS_PROCESSOR_MAX_QUEUE_SIZE_DEFAULT = 2_048 * 4;

export const getLogger = (
  env: Env,
): { logger: Logger; shutdown: () => Promise<void> } => {
  const authToken = Buffer.from(
    `${env.LOKI_USERNAME}:${env.LOKI_PASSWORD}`,
  ).toString('base64');
  const logExporter = new OTLPLogExporter({
    // from https://grafana.com/docs/loki/latest/reference/loki-http-api/#ingest-logs-using-otlp
    url: `${env.LOKI_ENDPOINT}/otlp/v1/logs`,

    headers: {
      Authorization: `Basic ${authToken}`,
    },
  });

  const loggerProvider = new LoggerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'backend_canister',
      canister_id: env.BACKEND_CANISTER_ID,
    }),
  });

  loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(logExporter, {
      maxQueueSize: LOGS_PROCESSOR_MAX_QUEUE_SIZE_DEFAULT,
    }),
  );

  return {
    logger: loggerProvider.getLogger('backend_canister_logger'),
    shutdown: () => loggerProvider.shutdown(),
  };
};
