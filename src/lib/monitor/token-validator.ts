import { prisma } from "@/lib/prisma/prisma";

/**
 * Validate a service token and return the associated monitor
 * @param token - Service token to validate
 * @returns Monitor if token is valid, null otherwise
 */
export async function validateToken(token: string) {
  const monitor = await prisma.monitor.findUnique({
    where: { serviceToken: token },
    include: { user: true },
  });

  if (!monitor) {
    return null;
  }

  // Verify monitor is active and is APP_LOG type
  if (!monitor.isActive || monitor.type !== "APP_LOG") {
    return null;
  }

  return monitor;
}

