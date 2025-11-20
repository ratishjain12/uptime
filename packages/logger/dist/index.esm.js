// src/client.ts
function getBaseUrl(configBaseUrl) {
  if (configBaseUrl) {
    return configBaseUrl;
  }
  if (typeof process !== "undefined" && process.env?.UPTIME_API_URL) {
    return process.env.UPTIME_API_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}
async function sendLog(config, payload) {
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
        Authorization: `Bearer ${config.token}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.error(
        `[UptimeLogger] Failed to send log: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("[UptimeLogger] Error sending log:", error);
  }
}

// src/logger.ts
var UptimeLogger = class _UptimeLogger {
  constructor(config, context = {}) {
    if (!config.token) {
      throw new Error("Token is required for UptimeLogger");
    }
    this.config = {
      token: config.token,
      serviceName: config.serviceName,
      enabled: config.enabled ?? true,
      baseUrl: config.baseUrl,
      environment: config.environment
    };
    this.context = context;
  }
  /**
   * Create a child logger with additional context
   * @param context Additional metadata to include in all logs from this child
   * @returns New UptimeLogger instance with merged context
   */
  child(context) {
    const mergedContext = { ...this.context, ...context };
    return new _UptimeLogger(this.config, mergedContext);
  }
  /**
   * Internal method to handle logging
   */
  _log(level, message, options) {
    const metadata = options && "metadata" in options ? options.metadata : options;
    const timestamp = options && "timestamp" in options ? options.timestamp : void 0;
    const mergedMetadata = {
      ...this.context,
      ...metadata
    };
    if (this.config.environment) {
      mergedMetadata.environment = this.config.environment;
    }
    const payload = {
      level,
      message,
      timestamp: timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : void 0
    };
    sendLog(this.config, payload).catch((error) => {
      console.error("[UptimeLogger] Unexpected error:", error);
    });
  }
  error(message, metadataOrOptions) {
    this._log("error", message, metadataOrOptions);
  }
  warn(message, metadataOrOptions) {
    this._log("warn", message, metadataOrOptions);
  }
  info(message, metadataOrOptions) {
    this._log("info", message, metadataOrOptions);
  }
  debug(message, metadataOrOptions) {
    this._log("debug", message, metadataOrOptions);
  }
};

// src/index.ts
function createLogger(config) {
  return new UptimeLogger(config);
}

export { UptimeLogger, createLogger };
//# sourceMappingURL=index.esm.js.map
//# sourceMappingURL=index.esm.js.map