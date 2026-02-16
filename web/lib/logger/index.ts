type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  context?: string;
  enabled?: boolean;
}

const isDev = process.env.NODE_ENV === "development";

class Logger {
  private context: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.context = options.context ?? "App";
    this.enabled = options.enabled ?? isDev;
  }

  private formatMessage(level: LogLevel, ...args: unknown[]): unknown[] {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    return [prefix, ...args];
  }

  debug(...args: unknown[]): void {
    if (this.enabled) {
      console.debug(...this.formatMessage("debug", ...args));
    }
  }

  info(...args: unknown[]): void {
    if (this.enabled) {
      console.info(...this.formatMessage("info", ...args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.enabled) {
      console.warn(...this.formatMessage("warn", ...args));
    }
  }

  error(...args: unknown[]): void {
    console.error(...this.formatMessage("error", ...args));
  }
}

export function createLogger(context: string, enabled?: boolean): Logger {
  return new Logger({ context, enabled });
}

export const logger = new Logger();
