import { sendLog } from "./client";
import type {
  LogLevel,
  LogMetadata,
  LoggerConfig,
  LogOptions,
  JsonValue,
} from "./types";

/**
 * UptimeLogger - Send application logs to Uptime Monitor
 */
export class UptimeLogger {
  private config: {
    token: string;
    serviceName?: string;
    enabled: boolean;
    baseUrl?: string;
    environment?: string;
  };
  private context: LogMetadata;

  constructor(config: LoggerConfig, context: LogMetadata = {}) {
    if (!config.token) {
      throw new Error("Token is required for UptimeLogger");
    }

    this.config = {
      token: config.token,
      serviceName: config.serviceName,
      enabled: config.enabled ?? true,
      baseUrl: config.baseUrl,
      environment: config.environment,
    };
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   * @param context Additional metadata to include in all logs from this child
   * @returns New UptimeLogger instance with merged context
   */
  child(context: LogMetadata): UptimeLogger {
    const mergedContext = { ...this.context, ...context };
    return new UptimeLogger(this.config, mergedContext);
  }

  /**
   * Internal method to handle logging
   */
  private _log(
    level: LogLevel,
    message: string,
    options?: LogOptions | LogMetadata
  ): void {
    // Handle both LogOptions and LogMetadata (for backward compatibility)
    const metadata =
      options && "metadata" in options ? options.metadata : options;
    const timestamp =
      options && "timestamp" in options ? options.timestamp : undefined;

    // Merge context with provided metadata
    const mergedMetadata: LogMetadata = {
      ...(this.context as Record<string, JsonValue>),
      ...(metadata as Record<string, JsonValue> | undefined),
    };

    // Include environment in metadata if set
    if (this.config.environment) {
      mergedMetadata.environment = this.config.environment;
    }

    const payload = {
      level,
      message,
      timestamp: (timestamp || new Date().toISOString()) as string,
      metadata:
        Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
    };

    // Send log (fire-and-forget, non-blocking)
    sendLog(this.config, payload).catch((error) => {
      // Error already logged in sendLog, but we can add additional handling here if needed
      console.error("[UptimeLogger] Unexpected error:", error);
    });
  }

  /**
   * Log an error
   */
  error(message: string, metadata?: LogMetadata): void;
  error(message: string, options?: LogOptions): void;
  error(message: string, metadataOrOptions?: LogMetadata | LogOptions): void {
    this._log("error", message, metadataOrOptions);
  }

  /**
   * Log a warning
   */
  warn(message: string, metadata?: LogMetadata): void;
  warn(message: string, options?: LogOptions): void;
  warn(message: string, metadataOrOptions?: LogMetadata | LogOptions): void {
    this._log("warn", message, metadataOrOptions);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: LogMetadata): void;
  info(message: string, options?: LogOptions): void;
  info(message: string, metadataOrOptions?: LogMetadata | LogOptions): void {
    this._log("info", message, metadataOrOptions);
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: LogMetadata): void;
  debug(message: string, options?: LogOptions): void;
  debug(message: string, metadataOrOptions?: LogMetadata | LogOptions): void {
    this._log("debug", message, metadataOrOptions);
  }
}
