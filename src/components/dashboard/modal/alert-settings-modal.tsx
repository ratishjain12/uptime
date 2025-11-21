"use client";

import { useCallback, useState, useTransition } from "react";
import { BellIcon } from "lucide-react";

import { updateMonitorAlertSettings } from "@/actions/monitor/alerts";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

type AlertSettingsFormValues = {
  slackWebhook: string;
  customWebhook: string;
  useSlack: boolean;
  useCustomWebhook: boolean;
};

type AlertSettingsModalProps = {
  monitor: {
    id: string;
    name: string;
    slackWebhook: string | null;
    customWebhook: string | null;
  };
  children: React.ReactNode;
};

function useAlertSettingsForm(initialForm: AlertSettingsFormValues) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = useCallback(() => {
    setForm(initialForm);
    setError(null);
  }, [initialForm]);

  const setField = useCallback(
    <K extends keyof AlertSettingsFormValues>(
      field: K,
      value: AlertSettingsFormValues[K]
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

const isSlackWebhookUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith("slack.com") &&
      url.pathname.startsWith("/services/")
    );
  } catch {
    return false;
  }
};

const isWebhookUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

function validateForm(form: AlertSettingsFormValues) {
  if (form.useSlack && form.slackWebhook.trim()) {
    if (!isSlackWebhookUrl(form.slackWebhook.trim())) {
      return "Invalid Slack webhook URL. Must be a valid Slack incoming webhook URL.";
    }
  }

  if (form.useCustomWebhook && form.customWebhook.trim()) {
    if (!isWebhookUrl(form.customWebhook.trim())) {
      return "Invalid webhook URL. Must be a valid HTTPS URL.";
    }
  }

  return null;
}

export const AlertSettingsModal = ({
  monitor,
  children,
}: AlertSettingsModalProps) => {
  const [open, setOpen] = useState(false);
  const initialForm: AlertSettingsFormValues = {
    slackWebhook: monitor.slackWebhook ?? "",
    customWebhook: monitor.customWebhook ?? "",
    useSlack: !!monitor.slackWebhook,
    useCustomWebhook: !!monitor.customWebhook,
  };

  const { form, setField, error, setError, isPending, startTransition, reset } =
    useAlertSettingsForm(initialForm);

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
        await updateMonitorAlertSettings({
          monitorId: monitor.id,
          slackWebhook: form.useSlack ? form.slackWebhook.trim() : null,
          customWebhook: form.useCustomWebhook
            ? form.customWebhook.trim()
            : null,
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellIcon className="h-5 w-5" />
            Alert Settings
          </DialogTitle>
          <DialogDescription>
            Configure alert destinations for <strong>{monitor.name}</strong>.
            You can set up Slack notifications, custom webhooks, or both.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Slack Webhook Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-4 py-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Slack Alerts</span>
                  {form.useSlack && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Receive downtime alerts in your Slack workspace via incoming
                  webhook.
                </p>
              </div>
              <Switch
                checked={form.useSlack}
                onCheckedChange={(checked) => {
                  setField("useSlack", checked);
                  if (!checked) {
                    setField("slackWebhook", "");
                  }
                }}
                aria-label="Enable Slack alerts"
              />
            </div>

            {form.useSlack && (
              <div className="space-y-2 pl-4 border-l-2 border-border/60">
                <label
                  htmlFor="slack-webhook"
                  className="block text-sm font-medium"
                >
                  Slack Webhook URL
                </label>
                <Input
                  id="slack-webhook"
                  placeholder="https://hooks.slack.com/services/..."
                  value={form.slackWebhook}
                  onChange={(event) =>
                    setField("slackWebhook", event.target.value)
                  }
                  required={form.useSlack}
                />
                <p className="text-xs text-muted-foreground">
                  Generate this URL from Slack (&ldquo;Incoming Webhooks&rdquo;)
                  and paste it here.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Custom Webhook Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-4 py-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Custom Webhook</span>
                  {form.useCustomWebhook && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Send monitor events to any HTTP endpoint. Perfect for
                  integrations with Zapier, Make, or your own systems.
                </p>
              </div>
              <Switch
                checked={form.useCustomWebhook}
                onCheckedChange={(checked) => {
                  setField("useCustomWebhook", checked);
                  if (!checked) {
                    setField("customWebhook", "");
                  }
                }}
                aria-label="Enable custom webhook"
              />
            </div>

            {form.useCustomWebhook && (
              <div className="space-y-2 pl-4 border-l-2 border-border/60">
                <label
                  htmlFor="custom-webhook"
                  className="block text-sm font-medium"
                >
                  Webhook URL
                </label>
                <Input
                  id="custom-webhook"
                  placeholder="https://your-endpoint.com/webhook"
                  value={form.customWebhook}
                  onChange={(event) =>
                    setField("customWebhook", event.target.value)
                  }
                  required={form.useCustomWebhook}
                />
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex-1">
                    Enter a valid HTTPS URL to receive monitor events as JSON
                    payloads.
                  </p>
                  {form.customWebhook.trim() && (
                    <TestWebhookButton monitorId={monitor.id} />
                  )}
                </div>
              </div>
            )}
          </div>

          {!form.useSlack && !form.useCustomWebhook && (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No alert destinations configured. Enable Slack or Custom Webhook
                to receive notifications when this monitor goes down.
              </p>
            </div>
          )}

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
              {isPending ? "Saving..." : "Save Alert Settings"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TestWebhookButton = ({ monitorId }: { monitorId: string }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-webhook-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitorId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult("✅ Test webhook sent successfully!");
      } else {
        setResult(`❌ Test failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setResult(
        `❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsTesting(false);
      setTimeout(() => setResult(null), 5000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={isTesting}
        className="text-xs h-7"
      >
        {isTesting ? "Testing..." : "Test"}
      </Button>
      {result && (
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {result}
        </p>
      )}
    </div>
  );
};
