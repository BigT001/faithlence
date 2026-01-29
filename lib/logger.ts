/**
 * Logging Utility
 * Centralized logging with timestamps and context
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
  error?: string;
}

const logs: LogEntry[] = [];

function getTimestamp(): string {
  return new Date().toISOString();
}

function formatLog(entry: LogEntry): string {
  const emoji = {
    INFO: 'ℹ️',
    WARN: '⚠️',
    ERROR: '❌',
    DEBUG: '🐛',
    SUCCESS: '✅',
  };

  let msg = `${emoji[entry.level]} [${entry.timestamp}] [${entry.service}] ${entry.message}`;

  if (entry.data) {
    msg += ` | Data: ${JSON.stringify(entry.data).substring(0, 200)}`;
  }

  if (entry.error) {
    msg += ` | Error: ${entry.error.substring(0, 150)}`;
  }

  return msg;
}

export function log(
  service: string,
  message: string,
  level: LogLevel = 'INFO',
  data?: any,
  error?: any
) {
  const entry: LogEntry = {
    timestamp: getTimestamp(),
    level,
    service,
    message,
    data,
    error: error instanceof Error ? error.message : error ? String(error) : undefined,
  };

  logs.push(entry);

  // Console output
  const formatted = formatLog(entry);

  if (level === 'ERROR') {
    console.error(formatted);
  } else if (level === 'WARN') {
    console.warn(formatted);
  } else if (level === 'SUCCESS') {
    console.log(`\x1b[32m${formatted}\x1b[0m`); // Green
  } else {
    console.log(formatted);
  }
}

export function getLogs(): LogEntry[] {
  return logs;
}

export function clearLogs() {
  logs.length = 0;
}

export function getLogsAsJSON() {
  return JSON.stringify(logs, null, 2);
}

// Shortcut functions
export const logger = {
  info: (service: string, message: string, data?: any) => log(service, message, 'INFO', data),
  warn: (service: string, message: string, data?: any) => log(service, message, 'WARN', data),
  error: (service: string, message: string, error?: any, data?: any) =>
    log(service, message, 'ERROR', data, error),
  debug: (service: string, message: string, data?: any) => log(service, message, 'DEBUG', data),
  success: (service: string, message: string, data?: any) => log(service, message, 'SUCCESS', data),
};
