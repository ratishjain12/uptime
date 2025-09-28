"use client";

import { useTransition } from "react";

import { deleteMonitor } from "@/actions/monitor";
import { UpdateMonitorModal } from "@/components/dashboard/modal";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";

export type MonitorCardProps = {
  monitor: {
    id: string;
    name: string;
    url: string;
    intervalSec: number;
    isActive: boolean;
    lastStatus: string | null;
    lastLatencyMs: number | null;
  };
};

export const MonitorCard = ({ monitor }: MonitorCardProps) => {
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMonitor({ id: monitor.id });
    });
  };

  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-medium">{monitor.name}</h3>
          <p className="text-muted-foreground text-sm break-all">
            {monitor.url}
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
          <UpdateMonitorModal monitor={monitor}>
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
          <dd>{monitor.lastLatencyMs ? `${monitor.lastLatencyMs} ms` : "—"}</dd>
        </div>
      </dl>
    </div>
  );
};
