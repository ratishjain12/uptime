import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/monitor/token-validator";
import {
  shouldTriggerAlert,
  updateMonitorStatus,
} from "@/lib/monitor/log-processor";
import { inngest } from "@/inngest/client";

type LogPayload = {
  level: "error" | "warn" | "info" | "debug";
  message: string;
  timestamp?: string;
  metadata?: Record<string, any>;
};

/**
 * Extract token from Authorization header
 * Supports both "Bearer <token>" and "X-Service-Token: <token>" formats
 */
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try X-Service-Token header
  const serviceToken = request.headers.get("x-service-token");
  if (serviceToken) {
    return serviceToken;
  }

  return null;
}

/**
 * Validate log payload
 */
function validatePayload(body: unknown): body is LogPayload {
  if (!body || typeof body !== "object") return false;

  const payload = body as Record<string, unknown>;

  // level is required and must be one of the valid levels
  if (
    !payload.level ||
    !["error", "warn", "info", "debug"].includes(payload.level as string)
  ) {
    return false;
  }

  // message is required and must be a string
  if (!payload.message || typeof payload.message !== "string") {
    return false;
  }

  // timestamp is optional but must be a string if provided
  if (payload.timestamp && typeof payload.timestamp !== "string") {
    return false;
  }

  // metadata is optional but must be an object if provided
  if (payload.metadata && typeof payload.metadata !== "object") {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Extract and validate token
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 401 }
      );
    }

    // Find monitor by token
    const monitor = await validateToken(token);
    if (!monitor) {
      return NextResponse.json(
        { error: "Invalid token or monitor not found" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!validatePayload(body)) {
      return NextResponse.json(
        { error: "Invalid payload. Required: level, message" },
        { status: 400 }
      );
    }

    const { level, message, timestamp, metadata } = body;

    // Update monitor status
    await updateMonitorStatus(monitor.id, level);

    // Check if alert should be triggered
    if (shouldTriggerAlert(level, monitor.logThreshold)) {
      // Trigger Inngest event for alert
      await inngest.send({
        name: "monitor/log.alert",
        data: {
          monitorId: monitor.id,
          level,
          message,
          timestamp: timestamp || new Date().toISOString(),
          serviceName: monitor.serviceName,
          metadata,
        },
      });
    }

    return NextResponse.json(
      { success: true, message: "Log ingested successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error ingesting log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

