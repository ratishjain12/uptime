"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/prisma";

const SETTINGS_PATH = "/dashboard/settings";

export const getWebhookSettings = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { customWebhook: true },
  });

  return {
    customWebhook: user?.customWebhook ?? null,
  };
};

const isWebhookUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export const updateWebhook = async (formData: FormData) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const value = formData.get("customWebhook");
  const customWebhook = typeof value === "string" ? value.trim() : "";

  if (!customWebhook) {
    throw new Error("Webhook URL is required");
  }

  if (!isWebhookUrl(customWebhook)) {
    throw new Error("Invalid webhook URL. Must be a valid HTTPS URL");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { customWebhook },
  });

  revalidatePath(SETTINGS_PATH);
};

export const disconnectWebhook = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { customWebhook: null },
  });

  revalidatePath(SETTINGS_PATH);
};
