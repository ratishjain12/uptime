"use client";

import { useTransition } from "react";

import { deleteMonitor } from "@/actions/monitor";
import { UpdateMonitorModal } from "@/components/dashboard/modal";
import { AlertSettingsModal } from "@/components/dashboard/modal/alert-settings-modal";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon, BellIcon } from "lucide-react";

export type MonitorCardProps = {
  monitor: {
    id: string;
    name: string;
    url: string;
    type: "HTTP_PING" | "APP_LOG";
    intervalSec: number;
    isActive: boolean;
    lastStatus: string | null;
    lastLatencyMs: number | null;
    slackWebhook: string | null;
    customWebhook: string | null;
    serviceName: string | null;
    logThreshold: string | null;
  };
};

export const MonitorCard = ({ monitor }: MonitorCardProps) => {
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMonitor({ id: monitor.id });
    });
  };

  const hasAlertsConfigured = !!(monitor.slackWebhook || monitor.customWebhook);

  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-medium">{monitor.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                monitor.type === "HTTP_PING"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
              }`}
            >
              {monitor.type === "HTTP_PING" ? "HTTP Ping" : "App Log"}
            </span>
            {hasAlertsConfigured && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <BellIcon className="h-3 w-3" />
                Alerts
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm break-all">
            {monitor.type === "HTTP_PING"
              ? monitor.url
              : monitor.serviceName || "App Logger"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              monitor.isActive ? "text-emerald-600" : "text-muted-foreground"
            }`}
          >
            {monitor.isActive ? "Active" : "Paused"}
          </span>
          <AlertSettingsModal
            monitor={{
              id: monitor.id,
              name: monitor.name,
              slackWebhook: monitor.slackWebhook,
              customWebhook: monitor.customWebhook,
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${
                hasAlertsConfigured
                  ? "text-emerald-600 hover:text-emerald-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={`Configure alerts for ${monitor.name}`}
            >
              <BellIcon className="h-4 w-4" />
            </Button>
          </AlertSettingsModal>
          <UpdateMonitorModal
            monitor={{
              id: monitor.id,
              name: monitor.name,
              url: monitor.url,
              type: monitor.type,
              intervalSec: monitor.intervalSec,
              isActive: monitor.isActive,
              serviceName: monitor.serviceName,
              logThreshold: monitor.logThreshold,
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label={`Edit monitor ${monitor.name}`}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </UpdateMonitorModal>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete monitor ${monitor.name}`}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        {monitor.type === "HTTP_PING" ? (
          <>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Interval</dt>
              <dd>{monitor.intervalSec / 60} min</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last status</dt>
              <dd>{monitor.lastStatus ?? "Unknown"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Latency</dt>
              <dd>
                {monitor.lastLatencyMs ? `${monitor.lastLatencyMs} ms` : "—"}
              </dd>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Service</dt>
              <dd>{monitor.serviceName ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Alert threshold</dt>
              <dd>{monitor.logThreshold ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last status</dt>
              <dd>{monitor.lastStatus ?? "No logs yet"}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
};
