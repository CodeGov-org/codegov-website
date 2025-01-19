import { type LogLevel, type LogEntry } from '@cg/backend';
import { fetchLogs } from './fetcher';
import { getLogger } from './otlp';
import { type LogRecord, SeverityNumber } from '@opentelemetry/api-logs';

const mapLogLevel = (level: LogLevel): SeverityNumber => {
  if ('info' in level) {
    return SeverityNumber.INFO;
  } else if ('warn' in level) {
    return SeverityNumber.WARN;
  } else if ('error' in level) {
    return SeverityNumber.ERROR;
  }
  return SeverityNumber.UNSPECIFIED;
};

const mapLog = (canisterLog: LogEntry): LogRecord => {
  const timestamp = new Date(canisterLog.date_time);

  return {
    timestamp,
    observedTimestamp: new Date(),
    severityNumber: mapLogLevel(canisterLog.level),
    body: {
      message: canisterLog.message,
      context: canisterLog.context[0],
    },
  };
};

export default {
  // The scheduled handler is invoked at the interval set in our wrangler.json's
  // [[triggers]] configuration.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async scheduled(_event, env, _ctx): Promise<void> {
    const logs = await fetchLogs(env);

    const { logger, shutdown } = getLogger(env);
    for (const log of logs) {
      logger.emit(mapLog(log));
    }

    await shutdown();

    console.log('Logs emitted');
  },
} satisfies ExportedHandler<Env>;
