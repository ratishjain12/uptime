"use client";

import { useCallback, useState, useTransition } from "react";

import { createMonitor, updateMonitor } from "@/actions/monitor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const INTERVAL_OPTIONS = [
  { label: "Every minute", value: 1 * 60 },
  { label: "Every 5 minutes", value: 5 * 60 },
  { label: "Every 10 minutes", value: 10 * 60 },
  { label: "Every 15 minutes", value: 15 * 60 },
  { label: "Every 30 minutes", value: 30 * 60 },
];

const DEFAULT_INTERVAL_SEC = 5 * 60;

export type MonitorFormValues = {
  name: string;
  type: "HTTP_PING" | "APP_LOG";
  url: string;
  intervalSec: number;
  isActive: boolean;
  // APP_LOG specific
  serviceName: string;
  logThreshold: string;
};

const DEFAULT_FORM: MonitorFormValues = {
  name: "",
  type: "HTTP_PING",
  url: "",
  intervalSec: DEFAULT_INTERVAL_SEC,
  isActive: true,
  serviceName: "",
  logThreshold: "error",
};

function useMonitorForm(initialForm: MonitorFormValues) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = useCallback(() => {
    setForm(initialForm);
    setError(null);
  }, [initialForm]);

  const setField = useCallback(
    <K extends keyof MonitorFormValues>(
      field: K,
      value: MonitorFormValues[K]
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return {
    form,
    setField,
    error,
    setError,
    isPending,
    startTransition,
    reset,
  } as const;
}

const LOG_THRESHOLD_OPTIONS = [
  { label: "Error", value: "error" },
  { label: "Warn", value: "warn" },
  { label: "Info", value: "info" },
  { label: "Debug", value: "debug" },
];

function MonitorFormFields({
  form,
  onFieldChange,
}: {
  form: MonitorFormValues;
  onFieldChange: <K extends keyof MonitorFormValues>(
    field: K,
    value: MonitorFormValues[K]
  ) => void;
}) {
  const isHttpPing = form.type === "HTTP_PING";

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="monitor-name">
          Name
        </label>
        <Input
          id="monitor-name"
          placeholder="My website"
          value={form.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="monitor-type">
          Monitor Type
        </label>
        <Select
          value={form.type}
          onValueChange={(value) => {
            const newType = value as "HTTP_PING" | "APP_LOG";
            onFieldChange("type", newType);
            // Ensure intervalSec is set when switching to HTTP_PING
            // Preserve existing value if it exists, otherwise use default
            if (newType === "HTTP_PING") {
              const currentInterval = form.intervalSec || DEFAULT_INTERVAL_SEC;
              // Check if current interval is valid (exists in INTERVAL_OPTIONS)
              const isValidInterval = INTERVAL_OPTIONS.some(
                (opt) => opt.value === currentInterval
              );
              onFieldChange(
                "intervalSec",
                isValidInterval ? currentInterval : DEFAULT_INTERVAL_SEC
              );
            }
          }}
        >
          <SelectTrigger id="monitor-type" className="w-full">
            <SelectValue placeholder="Select monitor type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HTTP_PING">HTTP Ping</SelectItem>
            <SelectItem value="APP_LOG">Application Logger</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {isHttpPing
            ? "Monitor website uptime with HTTP requests"
            : "Receive logs directly from your application"}
        </p>
      </div>

      {isHttpPing ? (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="monitor-url">
              URL
            </label>
            <Input
              id="monitor-url"
              placeholder="https://example.com"
              value={form.url}
              onChange={(event) => onFieldChange("url", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="monitor-interval">
              Interval
            </label>
            <Select
              key={`interval-${form.type}`}
              value={form.intervalSec ? String(form.intervalSec) : String(DEFAULT_INTERVAL_SEC)}
              onValueChange={(value) =>
                onFieldChange("intervalSec", Number(value))
              }
            >
              <SelectTrigger id="monitor-interval" className="w-full">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="monitor-service-name">
              Service Name
            </label>
            <Input
              id="monitor-service-name"
              placeholder="My API Service"
              value={form.serviceName}
              onChange={(event) =>
                onFieldChange("serviceName", event.target.value)
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              A descriptive name for your application service
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="monitor-log-threshold">
              Alert Threshold
            </label>
            <Select
              value={form.logThreshold}
              onValueChange={(value) => onFieldChange("logThreshold", value)}
            >
              <SelectTrigger id="monitor-log-threshold" className="w-full">
                <SelectValue placeholder="Select log level" />
              </SelectTrigger>
              <SelectContent>
                {LOG_THRESHOLD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Alerts will be sent when logs at or above this level are received
            </p>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
        <div className="space-y-1">
          <span className="text-sm font-medium">Active</span>
          <p className="text-muted-foreground text-xs">
            Pause monitoring without deleting the monitor.
          </p>
        </div>
        <Switch
          checked={form.isActive}
          onCheckedChange={(checked) => onFieldChange("isActive", checked)}
          aria-label="Toggle monitor active state"
        />
      </div>
    </>
  );
}

function validateForm(form: MonitorFormValues) {
  if (!form.name.trim()) {
    return "Name is required.";
  }

  if (form.type === "HTTP_PING") {
    if (!form.url.trim()) {
      return "URL is required for HTTP Ping monitors.";
    }

    try {
      const parsedUrl = new URL(form.url.trim());
      if (!parsedUrl.protocol.startsWith("http")) {
        return "Only http and https protocols are supported.";
      }
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Please enter a valid URL.";
    }
  } else {
    // APP_LOG validation
    if (!form.serviceName.trim()) {
      return "Service name is required for Application Logger monitors.";
    }
    if (!form.logThreshold) {
      return "Log threshold is required.";
    }
  }

  return null;
}

function BaseMonitorModal({
  trigger,
  title,
  description,
  initialValues,
  onSubmit,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  initialValues: MonitorFormValues;
  onSubmit: (values: MonitorFormValues) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const { form, setField, error, setError, isPending, startTransition, reset } =
    useMonitorForm(initialValues);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit({
          ...form,
          name: form.name.trim(),
          url: form.url.trim(),
          serviceName: form.serviceName.trim(),
        });
        reset();
        setOpen(false);
      } catch (submitError) {
        console.error(submitError);
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Something went wrong."
        );
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <MonitorFormFields form={form} onFieldChange={setField} />

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const AddMonitorModal = () => (
  <BaseMonitorModal
    trigger={
      <Button size="sm" className="bg-accent-foreground">
        Add Monitor
      </Button>
    }
    title="Add Monitor"
    description="Create a new monitor to track uptime or receive application logs."
    initialValues={DEFAULT_FORM}
    onSubmit={async (values) => {
      await createMonitor({
        name: values.name,
        type: values.type,
        url: values.type === "HTTP_PING" ? values.url : "",
        intervalSec: values.intervalSec,
        isActive: values.isActive,
        serviceName: values.type === "APP_LOG" ? values.serviceName : undefined,
        logThreshold: values.type === "APP_LOG" ? values.logThreshold : undefined,
        createdAt: new Date(),
      });
    }}
  />
);

const UpdateMonitorModal = ({
  monitor,
  children,
}: {
  monitor: {
    id: string;
    name: string;
    url: string;
    type: "HTTP_PING" | "APP_LOG";
    intervalSec: number;
    isActive: boolean;
    serviceName?: string | null;
    logThreshold?: string | null;
  };
  children: React.ReactNode;
}) => {
  return (
    <BaseMonitorModal
      trigger={children}
      title="Update monitor"
      description="Modify the monitor settings and save to apply changes."
      initialValues={{
        name: monitor.name,
        type: monitor.type,
        url: monitor.url,
        intervalSec: monitor.intervalSec,
        isActive: monitor.isActive,
        serviceName: monitor.serviceName ?? "",
        logThreshold: monitor.logThreshold ?? "error",
      }}
      onSubmit={async (values) => {
        await updateMonitor({
          id: monitor.id,
          name: values.name,
          type: values.type,
          url: values.type === "HTTP_PING" ? values.url : monitor.url,
          intervalSec: values.intervalSec,
          isActive: values.isActive,
          serviceName: values.type === "APP_LOG" ? values.serviceName : undefined,
          logThreshold: values.type === "APP_LOG" ? values.logThreshold : undefined,
        });
      }}
    />
  );
};

export { AddMonitorModal, UpdateMonitorModal };
