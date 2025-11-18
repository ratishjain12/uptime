"use server";

import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type CreateMonitorInput = {
  name: string;
  url: string;
  type?: "HTTP_PING" | "APP_LOG";
  intervalSec?: number;
  isActive?: boolean;
  nextCheckAt?: Date;
  createdAt?: Date;
  // APP_LOG specific
  serviceName?: string;
  logThreshold?: string;
};

type UpdateMonitorInput = {
  id: string;
  name?: string;
  url?: string;
  type?: "HTTP_PING" | "APP_LOG";
  intervalSec?: number;
  isActive?: boolean;
  // APP_LOG specific
  serviceName?: string;
  logThreshold?: string;
};

export const createMonitor = async (monitor: CreateMonitorInput) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const monitorType = monitor.type ?? "HTTP_PING";
  const interval = monitor.intervalSec ?? 300;
  const now = new Date();
  // Only set nextCheckAt for HTTP_PING monitors
  const nextCheckAt =
    monitorType === "HTTP_PING"
      ? new Date(now.getTime() + interval * 1000)
      : null;

  const createdMonitor = await prisma.monitor.create({
    data: {
      name: monitor.name,
      url: monitor.url,
      type: monitorType,
      intervalSec: monitor.intervalSec ?? 300,
      isActive: monitor.isActive ?? true,
      userId: session.user.id,
      nextCheckAt,
      createdAt: monitor.createdAt ?? new Date(),
      // APP_LOG specific fields
      serviceName: monitor.serviceName ?? null,
      logThreshold: monitor.logThreshold ?? null,
    },
  });

  revalidatePath("/dashboard");
  return createdMonitor;
};

export const updateMonitor = async (monitor: UpdateMonitorInput) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.monitor.findUnique({
    where: { id: monitor.id },
  });

  if (!existing) throw new Error("Monitor not found");

  const monitorType = monitor.type ?? existing.type;
  const nextInterval = monitor.intervalSec ?? existing.intervalSec;
  // Only set nextCheckAt for HTTP_PING monitors
  const makeNextCheck =
    monitorType === "HTTP_PING" && (monitor.isActive ?? existing.isActive)
      ? new Date(Date.now() + nextInterval * 1000)
      : monitorType === "APP_LOG"
        ? null
        : existing.nextCheckAt;

  const data = Object.fromEntries(
    Object.entries({
      name: monitor.name,
      url: monitor.url,
      type: monitor.type,
      intervalSec: monitor.intervalSec,
      isActive: monitor.isActive,
      nextCheckAt: makeNextCheck,
      serviceName: monitor.serviceName,
      logThreshold: monitor.logThreshold,
    }).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(data).length === 0) {
    throw new Error("No changes provided");
  }

  const updatedMonitor = await prisma.monitor.update({
    where: { id: monitor.id },
    data,
  });
  revalidatePath("/dashboard");
  return updatedMonitor;
};

export const deleteMonitor = async (monitor: { id: string }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const deletedMonitor = await prisma.monitor.delete({
    where: { id: monitor.id },
  });
  revalidatePath("/dashboard");
  return deletedMonitor;
};

export const getMonitors = async (search?: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const where: Prisma.MonitorWhereInput = { userId: session.user.id };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const monitors = await prisma.monitor.findMany({
    where,
    select: {
      id: true,
      name: true,
      url: true,
      type: true,
      intervalSec: true,
      isActive: true,
      lastStatus: true,
      lastLatencyMs: true,
      slackWebhook: true,
      customWebhook: true,
      serviceName: true,
      logThreshold: true,
    },
  });

  return monitors;
};
