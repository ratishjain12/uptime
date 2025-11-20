/**
 * Supported log levels
 */
type LogLevel = "error" | "warn" | "info" | "debug";
/**
 * JSON-serializable value type (recursive)
 */
type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};
/**
 * Metadata that can be attached to log entries
 * Uses JsonValue to ensure JSON-serializable data
 */
type LogMetadata = {
    [key: string]: JsonValue;
};
/**
 * Configuration options for the logger
 */
interface LoggerConfig {
    /**
     * Service token from Uptime Monitor dashboard (required)
     */
    token: string;
    /**
     * Service name identifier (optional, can be set per log)
     */
    serviceName?: string;
    /**
     * Base URL for the Uptime Monitor API
     * Defaults to UPTIME_API_URL env var or current origin
     */
    baseUrl?: string;
    /**
     * Whether logging is enabled
     * Default: true
     */
    enabled?: boolean;
    /**
     * Environment identifier (e.g., "production", "staging")
     */
    environment?: string;
}
/**
 * Options for individual log entries
 */
interface LogOptions {
    /**
     * Additional metadata to include with the log
     */
    metadata?: LogMetadata;
    /**
     * Custom timestamp (defaults to current time)
     */
    timestamp?: string;
}

/**
 * UptimeLogger - Send application logs to Uptime Monitor
 */
declare class UptimeLogger {
    private config;
    private context;
    constructor(config: LoggerConfig, context?: LogMetadata);
    /**
     * Create a child logger with additional context
     * @param context Additional metadata to include in all logs from this child
     * @returns New UptimeLogger instance with merged context
     */
    child(context: LogMetadata): UptimeLogger;
    /**
     * Internal method to handle logging
     */
    private _log;
    /**
     * Log an error
     */
    error(message: string, metadata?: LogMetadata): void;
    error(message: string, options?: LogOptions): void;
    /**
     * Log a warning
     */
    warn(message: string, metadata?: LogMetadata): void;
    warn(message: string, options?: LogOptions): void;
    /**
     * Log an info message
     */
    info(message: string, metadata?: LogMetadata): void;
    info(message: string, options?: LogOptions): void;
    /**
     * Log a debug message
     */
    debug(message: string, metadata?: LogMetadata): void;
    debug(message: string, options?: LogOptions): void;
}

/**
 * Convenience function to create a logger instance
 * @param config Logger configuration
 * @returns UptimeLogger instance
 */
declare function createLogger(config: LoggerConfig): UptimeLogger;

export { type LogLevel, type LogMetadata, type LogOptions, type LoggerConfig, UptimeLogger, createLogger };
