"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type CreateMonitorInput = {
  name: string;
  url: string;
  intervalSec?: number;
  isActive?: boolean;
  nextCheckAt?: Date;
  createdAt?: Date;
};

type UpdateMonitorInput = {
  id: string;
  name?: string;
  url?: string;
  intervalSec?: number;
  isActive?: boolean;
};

export const createMonitor = async (monitor: CreateMonitorInput) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const interval = monitor.intervalSec ?? 300;
  const now = new Date();
  const nextCheckAt = new Date(now.getTime() + interval * 1000);

  const createdMonitor = await prisma.monitor.create({
    data: {
      name: monitor.name,
      url: monitor.url,
      intervalSec: monitor.intervalSec ?? 300,
      isActive: monitor.isActive ?? true,
      userId: session.user.id,
      nextCheckAt,
      createdAt: monitor.createdAt ?? new Date(),
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

  const data = Object.fromEntries(
    Object.entries({
      name: monitor.name,
      url: monitor.url,
      intervalSec: monitor.intervalSec,
      isActive: monitor.isActive,
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

export const getMonitors = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const monitors = await prisma.monitor.findMany({
    where: { userId: session.user.id },
  });

  return monitors;
};
