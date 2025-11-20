import type { LogLevel, LogMetadata } from "./types";

/**
 * Payload sent to the API
 */
interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp?: string;
  metadata?: LogMetadata;
}

/**
 * Get the base URL for API requests
 */
function getBaseUrl(configBaseUrl?: string): string {
  // Use explicit baseUrl if provided
  if (configBaseUrl) {
    return configBaseUrl;
  }

  // Check environment variable
  if (typeof process !== "undefined" && process.env?.UPTIME_API_URL) {
    return process.env.UPTIME_API_URL;
  }

  // In browser, use current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Fallback (shouldn't happen in normal usage)
  return "";
}

/**
 * Send a log to the Uptime Monitor API
 * @param config Logger configuration
 * @param payload Log payload to send
 */
export async function sendLog(
  config: { token: string; baseUrl?: string; enabled?: boolean },
  payload: LogPayload
): Promise<void> {
  // Skip if disabled
  if (config.enabled === false) {
    return;
  }

  const baseUrl = getBaseUrl(config.baseUrl);
  if (!baseUrl) {
    console.warn(
      "[UptimeLogger] No base URL configured. Set baseUrl or UPTIME_API_URL environment variable."
    );
    return;
  }

  const url = `${baseUrl}/api/logs/ingest`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Log error but don't throw (non-blocking)
      console.error(
        `[UptimeLogger] Failed to send log: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    // Log error but don't throw (non-blocking)
    console.error("[UptimeLogger] Error sending log:", error);
  }
}

