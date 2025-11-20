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

