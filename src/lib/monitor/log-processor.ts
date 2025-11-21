/**
 * Log level severity mapping
 * Higher numbers indicate more severe logs
 */
const LOG_LEVEL_SEVERITY: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Cooldown periods in milliseconds for each log level
 * Higher severity = shorter cooldown (more frequent alerts)
 */
export const LOG_LEVEL_COOLDOWNS: Record<string, number> = {
  error: 5 * 60 * 1000,    // 5 minutes - critical issues need quick alerts
  warn: 15 * 60 * 1000,    // 15 minutes - moderate frequency
  info: 30 * 60 * 1000,    // 30 minutes - less frequent
  debug: 60 * 60 * 1000,   // 60 minutes - rarely alert
};

/**
 * Get numeric severity for a log level
 * @param level - Log level (debug, info, warn, error)
 * @returns Numeric severity (0-3)
 */
export function getLogLevelSeverity(level: string): number {
  const normalized = level.toLowerCase();
  return LOG_LEVEL_SEVERITY[normalized] ?? 0;
}

/**
 * Get numeric severity for a threshold
 * @param threshold - Threshold level (debug, info, warn, error)
 * @returns Numeric severity (0-3)
 */
function getThresholdSeverity(threshold: string): number {
  const normalized = threshold.toLowerCase();
  return LOG_LEVEL_SEVERITY[normalized] ?? 0;
}

/**
 * Check if a log level should trigger an alert based on threshold
 * @param level - Log level from the incoming log
 * @param threshold - Monitor's alert threshold setting
 * @returns true if alert should be triggered
 */
export function shouldTriggerAlert(
  level: string,
  threshold: string | null
): boolean {
  if (!threshold) return false;

  const logSeverity = getLogLevelSeverity(level);
  const thresholdSeverity = getThresholdSeverity(threshold);

  // Alert if log severity meets or exceeds threshold
  return logSeverity >= thresholdSeverity;
}

/**
 * Update monitor status with log level
 * @param monitorId - Monitor ID
 * @param level - Log level
 */
export async function updateMonitorStatus(
  monitorId: string,
  level: string
): Promise<void> {
  const { prisma } = await import("@/lib/prisma/prisma");
  
  await prisma.monitor.update({
    where: { id: monitorId },
    data: {
      lastStatus: level.toUpperCase(),
      lastCheckedAt: new Date(),
    },
  });
}

/**
 * Check if an alert should be sent based on severity-based cooldown and escalation
 * @param currentLevel - Current log level
 * @param lastAlertLevel - Last alert level that was sent
 * @param lastNotifiedAt - Timestamp of last alert
 * @returns true if alert should be sent
 */
export function shouldSendAlert(
  currentLevel: string,
  lastAlertLevel: string | null,
  lastNotifiedAt: Date | null
): boolean {
  // First alert - always send
  if (!lastNotifiedAt || !lastAlertLevel) {
    return true;
  }

  const currentSeverity = getLogLevelSeverity(currentLevel);
  const lastSeverity = getLogLevelSeverity(lastAlertLevel);
  const timeSinceLastAlert = Date.now() - new Date(lastNotifiedAt).getTime();

  // Severity escalation: Higher severity can override lower severity
  // If current alert is more severe than last alert, always send
  if (currentSeverity > lastSeverity) {
    return true;
  }

  // For same or lower severity, check cooldown
  const normalizedLevel = currentLevel.toLowerCase();
  const cooldown = LOG_LEVEL_COOLDOWNS[normalizedLevel] || LOG_LEVEL_COOLDOWNS.info;

  return timeSinceLastAlert > cooldown;
}

