import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { sendTestWebhook } from "@/actions/alerts/webhook";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await sendTestWebhook(session.user.id);

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
