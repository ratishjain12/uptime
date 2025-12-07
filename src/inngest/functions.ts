import { resend } from "@/lib/resend/resend";
import { sendMonitorSlackAlertForMonitor } from "@/actions/alerts/slack";
import { sendWebhookAlertForMonitor } from "@/actions/alerts/webhook";
import { inngest } from "./client";
import { prisma } from "@/lib/prisma/prisma";
import { shouldSendAlert } from "@/lib/monitor/log-processor";

export const checkMonitor = inngest.createFunction(
  { id: "monitor-check" },
  { event: "monitor/check" },
  async ({ event, step }) => {
    const { monitorId } = event.data;

    // 1. Load monitor
    const monitor = await step.run("load monitor", async () =>
      prisma.monitor.findUnique({
        where: { id: monitorId },
        include: { user: true },
      })
    );

    if (!monitor || !monitor.isActive || monitor.type !== "HTTP_PING") {
      return { status: "skipped" as const };
    }

    // Prevent duplicate concurrent checks: verify monitor is still due
    const now = new Date();
    if (
      monitor.nextCheckAt &&
      new Date(monitor.nextCheckAt).getTime() > now.getTime()
    ) {
      return {
        status: "skipped" as const,
        reason: "already-scheduled",
        nextCheckAt: monitor.nextCheckAt,
      };
    }

    // Update nextCheckAt immediately to prevent concurrent checks
    // This acts as a lock mechanism
    const nextCheckAt = new Date(Date.now() + monitor.intervalSec * 1000);
    await step.run("lock monitor", async () =>
      prisma.monitor.update({
        where: { id: monitor.id },
        data: { nextCheckAt },
      })
    );

    // 2. Ping monitor
    const { status, latency, statusDetail } = await step.run(
      "ping monitor",
      async () => {
        const started = performance.now();

        try {
          const res = await fetch(monitor.url, {
            method: "HEAD",
            redirect: "follow",
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
          });

          return {
            status: res.ok ? ("UP" as const) : ("DOWN" as const),
            latency: Math.round(performance.now() - started),
            statusDetail: res.ok ? "OK" : `HTTP ${res.status}`,
          };
        } catch (error: unknown) {
          console.warn(`Monitor ${monitor.id} network error`, error);

          const message =
            error instanceof Error ? error.message : "network error";

          return {
            status: "DOWN" as const,
            latency: Math.round(performance.now() - started),
            statusDetail: message,
          };
        }
      }
    );

    // 3. Update DB (status - nextCheckAt already set in lock step)
    await step.run("update monitor", async () =>
      prisma.monitor.update({
        where: { id: monitor.id },
        data: {
          lastCheckedAt: now,
          lastStatus: status,
          lastLatencyMs: latency,
          // nextCheckAt already set in "lock monitor" step above
        },
      })
    );

    // 4. Alert if DOWN & avoid duplicate spam
    if (status === "DOWN") {
      const lastNotifiedAtMs = monitor.lastNotifiedAt
        ? new Date(monitor.lastNotifiedAt).getTime()
        : null;

      const shouldNotify =
        !monitor.lastStatus ||
        monitor.lastStatus === "UP" ||
        !lastNotifiedAtMs ||
        Date.now() - lastNotifiedAtMs > 30 * 60 * 1000; // >30m since last alert

      if (shouldNotify) {
        await step.sendEvent("send-monitor-down-alert", {
          name: "monitor/down",
          data: {
            monitorId: monitor.id,
            url: monitor.url,
            name: monitor.name,
            userId: monitor.userId,
            userEmail: monitor.user.email,
            statusDetail,
            latency,
          },
        });

        await step.run("mark notified", async () => {
          await prisma.monitor.update({
            where: { id: monitor.id },
            data: { lastNotifiedAt: now },
          });
        });
      }
    }

    return { status, latency, statusDetail };
  }
);

export const scheduleChecks = inngest.createFunction(
  { id: "schedule-checks" },
  { cron: "*/1 * * * *" }, // every minute
  async ({ step }) => {
    const dueMonitors = await prisma.monitor.findMany({
      where: {
        isActive: true,
        type: "HTTP_PING", // Only schedule HTTP_PING monitors
        nextCheckAt: { lte: new Date() },
      },
      take: 100, // Process max 100 monitors per run to prevent overload
      orderBy: { nextCheckAt: "asc" }, // Process oldest due checks first
    });

    if (!dueMonitors.length) return { scheduled: 0 };
    await Promise.all(
      dueMonitors.map(
        async (monitor) =>
          await step.sendEvent("send-activation-event", {
            name: "monitor/check",
            data: {
              monitorId: monitor.id,
            },
          })
      )
    );

    return { scheduled: dueMonitors.length };
  }
);

export const sendMonitorDownAlert = inngest.createFunction(
  { id: "send-monitor-down-alert" },
  { event: "monitor/down" },
  async ({ event, step }) => {
    const { name, url, statusDetail, userEmail, userId, latency, monitorId } =
      event.data;

    await step.run("send-alert", async () => {
      await resend.emails.send({
        from: "alerts@updates.ratishfolio.com",
        to: [userEmail],
        subject: "Monitor Down",
        html: `
        <h2>${name} is DOWN</h2>
        <p>URL: <a href="${url}">${url}</a></p>
        <p>Status: ${statusDetail}</p>
      `,
      });
    });

    await step.run("send-slack-alert", async () => {
      await sendMonitorSlackAlertForMonitor(monitorId, {
        title: "Monitor DOWN",
        monitorName: name,
        monitorUrl: url,
        status: statusDetail,
        latencyMs: latency,
      });
    });

    await step.run("send-webhook-alert", async () => {
      await sendWebhookAlertForMonitor(monitorId, {
        event: "monitor.down",
        monitor: {
          id: monitorId,
          name,
          url,
          status: statusDetail,
          responseTime: latency,
        },
        timestamp: new Date().toISOString(),
        user: {
          id: userId,
          email: userEmail,
        },
      });
    });
  }
);

export const sendLogAlert = inngest.createFunction(
  { id: "send-log-alert" },
  { event: "monitor/log.alert" },
  async ({ event, step }) => {
    const { monitorId, level, message, timestamp, serviceName, metadata } =
      event.data;

    // Load monitor to get user info and check cooldown
    const monitor = await step.run("load monitor", async () =>
      prisma.monitor.findUnique({
        where: { id: monitorId },
        include: { user: true },
      })
    );

    if (!monitor) {
      return { status: "skipped" as const, reason: "monitor-not-found" };
    }

    // Check severity-based cooldown with escalation
    // Higher severity (error) can override lower severity (warn) alerts
    const lastNotifiedAtDate = monitor.lastNotifiedAt
      ? new Date(monitor.lastNotifiedAt)
      : null;

    const shouldNotify = shouldSendAlert(
      level,
      monitor.lastAlertLevel,
      lastNotifiedAtDate
    );

    if (!shouldNotify) {
      return {
        status: "skipped" as const,
        reason: "cooldown-active",
        lastAlertLevel: monitor.lastAlertLevel,
        lastNotifiedAt: monitor.lastNotifiedAt,
      };
    }

    const alertTitle = `Log Alert: ${level.toUpperCase()}`;
    const formattedTimestamp = timestamp
      ? new Date(timestamp).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    await step.run("send-email-alert", async () => {
      await resend.emails.send({
        from: "alerts@updates.ratishfolio.com",
        to: [monitor.user.email],
        subject: alertTitle,
        html: `
        <h2>${alertTitle}</h2>
        <p><strong>Monitor:</strong> ${serviceName || monitor.name}</p>
        <p><strong>Level:</strong> ${level}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Time:</strong> ${formattedTimestamp}</p>
        ${metadata ? `<p><strong>Metadata:</strong> <pre>${JSON.stringify(metadata, null, 2)}</pre></p>` : ""}
      `,
      });
    });

    await step.run("send-slack-alert", async () => {
      await sendMonitorSlackAlertForMonitor(monitorId, {
        title: alertTitle,
        serviceName: serviceName || monitor.name,
        logLevel: level,
        logMessage: message,
        logTimestamp: timestamp || new Date().toISOString(),
        metadata,
      });
    });

    await step.run("send-webhook-alert", async () => {
      await sendWebhookAlertForMonitor(monitorId, {
        event: "monitor.log.alert",
        monitor: {
          id: monitorId,
          name: monitor.name,
          type: "APP_LOG",
          serviceName: serviceName || monitor.name,
          status: level.toUpperCase(),
        },
        log: {
          level,
          message,
          timestamp: timestamp || new Date().toISOString(),
          metadata,
        },
        timestamp: new Date().toISOString(),
        user: {
          id: monitor.userId,
          email: monitor.user.email,
        },
      });
    });

    // Mark as notified with current alert level
    await step.run("mark notified", async () => {
      await prisma.monitor.update({
        where: { id: monitorId },
        data: {
          lastNotifiedAt: new Date(),
          lastAlertLevel: level.toUpperCase(),
        },
      });
    });

    return { status: "sent" as const };
  }
);
