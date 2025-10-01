"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
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
};

// --- Internal helpers (deduplicate formatting and posting) ---
const buildMonitorText = (input: MonitorAlertInput) => {
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

const getUserWebhookBySession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { slackWebhook: true },
  });

  const webhook = user?.slackWebhook?.trim();
  if (!webhook) throw new Error("Slack webhook not connected");
  return webhook;
};

const getUserWebhookByUserId = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { slackWebhook: true },
  });
  return user?.slackWebhook?.trim() ?? null;
};

export const sendSlackAlert = async (message: SlackMessage) => {
  const webhook = await getUserWebhookBySession();
  await postToWebhook(webhook, message);
  return { ok: true } as const;
};

export const sendMonitorSlackAlert = async (input: MonitorAlertInput) => {
  const text = buildMonitorText(input);
  return sendSlackAlert({
    text,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text },
      },
    ],
  });
};

// Background-safe helpers (no session required)
export const sendSlackAlertForUser = async (
  userId: string,
  message: SlackMessage
) => {
  const webhook = await getUserWebhookByUserId(userId);
  if (!webhook) return { ok: false as const, reason: "no-webhook" };
  await postToWebhook(webhook, message);
  return { ok: true as const };
};

export const sendMonitorSlackAlertForUser = async (
  userId: string,
  input: MonitorAlertInput
) => {
  const text = buildMonitorText(input);
  return sendSlackAlertForUser(userId, {
    text,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text },
      },
    ],
  });
};
