"use server";

import { prisma } from "@/lib/prisma/prisma";

type SlackMessage = {
  text: string;
  blocks?: unknown[];
};

type MonitorAlertInput = {
  title: string;
  monitorName?: string;
  monitorUrl?: string;
  status?: string;
  latencyMs?: number | null;
  // APP_LOG specific fields
  serviceName?: string;
  logLevel?: string;
  logMessage?: string;
  logTimestamp?: string;
  metadata?: Record<string, unknown>;
};

// --- Internal helpers (deduplicate formatting and posting) ---
const buildMonitorText = (input: MonitorAlertInput) => {
  // Check if this is an APP_LOG alert
  if (input.logLevel) {
    const lines: string[] = [];
    if (input.serviceName) lines.push(`*Monitor:* ${input.serviceName}`);
    if (input.logLevel) lines.push(`*Level:* ${input.logLevel}`);
    if (input.logMessage) lines.push(`*Message:* ${input.logMessage}`);
    if (input.logTimestamp) {
      const timestamp = new Date(input.logTimestamp).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      lines.push(`*Time:* ${timestamp}`);
    }
    if (input.metadata && Object.keys(input.metadata).length > 0) {
      lines.push(`*Metadata:* ${JSON.stringify(input.metadata, null, 2)}`);
    }
    return [input.title, ...lines].join("\n");
  }

  // HTTP_PING format (existing)
  const lines: string[] = [];
  if (input.monitorName) lines.push(`*Monitor:* ${input.monitorName}`);
  if (input.monitorUrl) lines.push(`*URL:* ${input.monitorUrl}`);
  if (input.status) lines.push(`*Status:* ${input.status}`);
  if (typeof input.latencyMs === "number")
    lines.push(`*Latency:* ${input.latencyMs} ms`);
  return [input.title, ...lines].join("\n");
};

const postToWebhook = async (webhook: string, message: SlackMessage) => {
  const payload: Record<string, unknown> = { text: message.text };
  if (message.blocks) payload.blocks = message.blocks;

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to send Slack alert: ${response.status} ${body}`);
  }
};

// Background-safe helpers (no session required)
export const sendSlackAlertForMonitor = async (
  monitorId: string,
  message: SlackMessage
) => {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: { slackWebhook: true, userId: true },
  });

  if (!monitor) {
    return { ok: false as const, reason: "monitor-not-found" };
  }

  // Try monitor-specific webhook first, then fall back to user default
  let webhook = monitor.slackWebhook?.trim();

  if (!webhook) {
    const user = await prisma.user.findUnique({
      where: { id: monitor.userId },
      select: { slackWebhook: true },
    });
    webhook = user?.slackWebhook?.trim();
  }

  if (!webhook) {
    return { ok: false as const, reason: "no-webhook" };
  }

  await postToWebhook(webhook, message);
  return { ok: true as const };
};

export const sendMonitorSlackAlertForMonitor = async (
  monitorId: string,
  input: MonitorAlertInput
) => {
  const text = buildMonitorText(input);
  return sendSlackAlertForMonitor(monitorId, {
    text,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text },
      },
    ],
  });
};
