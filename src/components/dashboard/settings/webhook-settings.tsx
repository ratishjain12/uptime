import {
  disconnectWebhook,
  getWebhookSettings,
  updateWebhook,
} from "@/actions/settings/webhook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WebhookTestButton } from "./webhook-test-button";

export const WebhookSettingsCard = async () => {
  const { customWebhook } = await getWebhookSettings();

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Custom webhooks</h2>
        <p className="text-sm text-muted-foreground">
          Send monitor events to any HTTP endpoint. Perfect for integrations with
          Zapier, Make, or your own systems.
        </p>
      </div>

      <form action={updateWebhook} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="customWebhook"
            className="block text-sm font-medium mb-2"
          >
            Webhook URL
          </label>
          <Input
            id="customWebhook"
            name="customWebhook"
            defaultValue={customWebhook ?? ""}
            placeholder="https://your-endpoint.com/webhook"
            required
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit">
            {customWebhook ? "Update webhook" : "Connect webhook"}
          </Button>
          {customWebhook ? (
            <Button
              formAction={disconnectWebhook}
              variant="outline"
              type="submit"
            >
              Disconnect
            </Button>
          ) : null}
        </div>

        {customWebhook ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground break-all">
              Currently sending events to: {customWebhook}
            </p>
            <WebhookTestButton />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Enter a valid HTTPS URL to receive monitor events as JSON payloads.
          </p>
        )}
      </form>
    </div>
  );
};

