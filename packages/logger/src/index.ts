export { UptimeLogger } from "./logger";
export type {
  LogLevel,
  LogMetadata,
  LoggerConfig,
  LogOptions,
} from "./types";

import { UptimeLogger } from "./logger";
import type { LoggerConfig } from "./types";

/**
 * Convenience function to create a logger instance
 * @param config Logger configuration
 * @returns UptimeLogger instance
 */
export function createLogger(config: LoggerConfig): UptimeLogger {
  return new UptimeLogger(config);
}

