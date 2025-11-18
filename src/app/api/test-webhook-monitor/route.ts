import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { sendTestWebhookForMonitor } from "@/actions/alerts/webhook";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { monitorId } = body;

    if (!monitorId || typeof monitorId !== "string") {
      return NextResponse.json(
        { error: "monitorId is required" },
        { status: 400 }
      );
    }

    const result = await sendTestWebhookForMonitor(monitorId);

    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.reason || "Webhook test failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Test webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
