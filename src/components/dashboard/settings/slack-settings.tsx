import {
  disconnectSlackWebhook,
  getSlackSettings,
  updateSlackWebhook,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SlackSettingsCard = async () => {
  const { slackWebhook } = await getSlackSettings();

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Global Slack alert</h2>
        <p className="text-sm text-muted-foreground">
          Paste a Slack incoming webhook URL to receive downtime alerts in your
          workspace.
        </p>
      </div>

      <form action={updateSlackWebhook} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="slackWebhook"
            className="block text-sm font-medium mb-2"
          >
            Slack webhook URL
          </label>
          <Input
            id="slackWebhook"
            name="slackWebhook"
            defaultValue={slackWebhook ?? ""}
            placeholder="https://hooks.slack.com/services/..."
            required
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit">
            {slackWebhook ? "Update webhook" : "Connect to Slack"}
          </Button>
          {slackWebhook ? (
            <Button
              formAction={disconnectSlackWebhook}
              variant="outline"
              type="submit"
            >
              Disconnect
            </Button>
          ) : null}
        </div>

        {slackWebhook ? (
          <p className="text-xs text-muted-foreground break-all">
            Currently sending alerts to: {slackWebhook}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Generate this URL from Slack (&ldquo;Incoming Webhooks&rdquo;) and
            paste it here.
          </p>
        )}
      </form>
    </div>
  );
};
