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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  console.error(`Webhook failed after 3 attempts for user ${userId}:`, lastError);
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
