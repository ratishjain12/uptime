"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/prisma";

const SETTINGS_PATH = "/dashboard/settings";

export const getSlackSettings = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { slackWebhook: true },
  });

  return {
    slackWebhook: user?.slackWebhook ?? null,
  };
};

const isSlackWebhookUrl = (value: string) => {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith("slack.com") &&
      url.pathname.startsWith("/services/")
    );
  } catch {
    return false;
  }
};

export const updateSlackWebhook = async (formData: FormData) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const value = formData.get("slackWebhook");
  const slackWebhook = typeof value === "string" ? value.trim() : "";

  if (!slackWebhook) {
    throw new Error("Slack webhook URL is required");
  }

  if (!isSlackWebhookUrl(slackWebhook)) {
    throw new Error("Invalid Slack webhook URL");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { slackWebhook },
  });

  revalidatePath(SETTINGS_PATH);
};

export const disconnectSlackWebhook = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { slackWebhook: null },
  });

  revalidatePath(SETTINGS_PATH);
};
