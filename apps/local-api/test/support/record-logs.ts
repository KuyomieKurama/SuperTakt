import { createLogger, type Logger } from '../../src/logger.ts';

interface RecordedLogLine {
  level: string;
  message: string;
  reason?: string;
}

export function recordLogs(): {
  readonly logger: Logger;
  readonly lines: RecordedLogLine[];
} {
  const lines: RecordedLogLine[] = [];
  const logger = createLogger((line) => lines.push(JSON.parse(line) as RecordedLogLine));
  return { logger, lines };
}
