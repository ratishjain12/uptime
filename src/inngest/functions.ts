import { resend } from "@/lib/resend/resend";
import { sendMonitorSlackAlertForUser } from "@/actions/alerts";
import { inngest } from "./client";
import { prisma } from "@/lib/prisma/prisma";

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

    if (!monitor || !monitor.isActive) {
      return { status: "skipped" as const };
    }

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

    // 3. Update DB (status + schedule next check)
    const now = new Date();

    await step.run("update monitor", async () =>
      prisma.monitor.update({
        where: { id: monitor.id },
        data: {
          lastCheckedAt: now,
          lastStatus: status,
          lastLatencyMs: latency,
          nextCheckAt: new Date(Date.now() + monitor.intervalSec * 1000),
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
        nextCheckAt: { lte: new Date() },
      },
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
    const { name, url, statusDetail, userEmail, userId } = event.data;

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
      await sendMonitorSlackAlertForUser(userId, {
        title: "Monitor DOWN",
        monitorName: name,
        monitorUrl: url,
        status: statusDetail,
        latencyMs: null,
      });
    });
  }
);
