"use server";

import { prisma } from "@/lib/prisma/prisma";

type WebhookPayload = {
  event: "monitor.down";
  monitor: {
    id: string;
    name: string;
    url: string;
    status: string;
    responseTime?: number;
  };
  timestamp: string;
  user: {
    id: string;
    email: string;
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const postToWebhook = async (webhook: string, payload: WebhookPayload) => {
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Webhook failed: ${response.status} ${body}`);
  }
};

export const sendWebhookAlertForMonitor = async (
  monitorId: string,
  payload: WebhookPayload
) => {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: { customWebhook: true, userId: true },
  });

  if (!monitor) {
    return { ok: false, reason: "monitor-not-found" };
  }

  // Try monitor-specific webhook first, then fall back to user default
  let webhook = monitor.customWebhook?.trim();

  if (!webhook) {
    const user = await prisma.user.findUnique({
      where: { id: monitor.userId },
      select: { customWebhook: true },
    });
    webhook = user?.customWebhook?.trim();
  }

  if (!webhook) {
    return { ok: false, reason: "no-webhook" };
  }

  // Retry logic: 3 attempts with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await postToWebhook(webhook, payload);
      return { ok: true };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt < 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      }
    }
  }

  // All attempts failed
  console.error(
    `Webhook failed after 3 attempts for monitor ${monitorId}:`,
    lastError
  );
  return { ok: false, reason: "max-retries-exceeded" };
};

// Legacy function for backward compatibility (deprecated)
export const sendWebhookAlertForUser = async (
  userId: string,
  payload: WebhookPayload
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { customWebhook: true },
  });

  const webhook = user?.customWebhook?.trim();
  if (!webhook) {
    return { ok: false, reason: "no-webhook" };
  }

  // Retry logic: 3 attempts with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await postToWebhook(webhook, payload);
      return { ok: true };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt < 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      }
    }
  }

  // All attempts failed
  console.error(
    `Webhook failed after 3 attempts for user ${userId}:`,
    lastError
  );
  return { ok: false, reason: "max-retries-exceeded" };
};

export const sendTestWebhook = async (userId: string) => {
  const testPayload: WebhookPayload = {
    event: "monitor.down",
    monitor: {
      id: "test-monitor-id",
      name: "Test Monitor",
      url: "https://example.com",
      status: "DOWN",
      responseTime: 5000,
    },
    timestamp: new Date().toISOString(),
    user: {
      id: userId,
      email: "test@example.com",
    },
  };

  return sendWebhookAlertForUser(userId, testPayload);
};

export const sendTestWebhookForMonitor = async (monitorId: string) => {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: { userId: true },
  });

  if (!monitor) {
    return { ok: false, reason: "monitor-not-found" };
  }

  const testPayload: WebhookPayload = {
    event: "monitor.down",
    monitor: {
      id: monitorId,
      name: "Test Monitor",
      url: "https://example.com",
      status: "DOWN",
      responseTime: 5000,
    },
    timestamp: new Date().toISOString(),
    user: {
      id: monitor.userId,
      email: "test@example.com",
    },
  };

  return sendWebhookAlertForMonitor(monitorId, testPayload);
};
