"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type UpdateMonitorAlertSettingsInput = {
  monitorId: string;
  slackWebhook: string | null;
  customWebhook: string | null;
};

export const updateMonitorAlertSettings = async (
  input: UpdateMonitorAlertSettingsInput
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify monitor belongs to user
  const existing = await prisma.monitor.findUnique({
    where: { id: input.monitorId },
    select: { userId: true },
  });

  if (!existing) {
    throw new Error("Monitor not found");
  }

  if (existing.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  // Validate webhooks if provided
  if (input.slackWebhook) {
    try {
      const url = new URL(input.slackWebhook);
      if (
        !(
          url.protocol === "https:" &&
          url.hostname.endsWith("slack.com") &&
          url.pathname.startsWith("/services/")
        )
      ) {
        throw new Error("Invalid Slack webhook URL");
      }
    } catch {
      throw new Error("Invalid Slack webhook URL");
    }
  }

  if (input.customWebhook) {
    try {
      const url = new URL(input.customWebhook);
      if (url.protocol !== "https:") {
        throw new Error("Invalid webhook URL. Must be HTTPS");
      }
    } catch {
      throw new Error("Invalid webhook URL");
    }
  }

  const updatedMonitor = await prisma.monitor.update({
    where: { id: input.monitorId },
    data: {
      slackWebhook: input.slackWebhook || null,
      customWebhook: input.customWebhook || null,
    },
  });

  revalidatePath("/dashboard");
  return updatedMonitor;
};

export const getMonitorAlertSettings = async (monitorId: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: {
      id: true,
      slackWebhook: true,
      customWebhook: true,
      userId: true,
    },
  });

  if (!monitor) {
    throw new Error("Monitor not found");
  }

  if (monitor.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  return {
    slackWebhook: monitor.slackWebhook,
    customWebhook: monitor.customWebhook,
  };
};

