/**
 * Supported log levels
 */
export type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * JSON-serializable value type (recursive)
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Metadata that can be attached to log entries
 * Uses JsonValue to ensure JSON-serializable data
 */
export type LogMetadata = { [key: string]: JsonValue };

/**
 * Configuration options for the logger
 */
export interface LoggerConfig {
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
export interface LogOptions {
  /**
   * Additional metadata to include with the log
   */
  metadata?: LogMetadata;

  /**
   * Custom timestamp (defaults to current time)
   */
  timestamp?: string;
}
