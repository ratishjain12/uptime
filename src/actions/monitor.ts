"use server";

import { Monitor } from "@/generated/prisma";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export const createMonitor = async (monitor: Monitor) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const createdMonitor = await prisma.monitor.create({
    data: {
      ...monitor,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  return createdMonitor;
};

export const updateMonitor = async (monitor: Monitor) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const updatedMonitor = await prisma.monitor.update({
    where: { id: monitor.id },
    data: { ...monitor },
  });
  revalidatePath("/dashboard");
  return updatedMonitor;
};

export const deleteMonitor = async (monitor: Monitor) => {
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
