import { Suspense } from "react";

import { SlackSettingsCard } from "@/components/dashboard/settings/slack-settings";
import { WebhookSettingsCard } from "@/components/dashboard/settings/webhook-settings";
import { Separator } from "@/components/ui/separator";

const Page = () => {
  return (
    <section className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage alert destinations and preferences for your monitors.
        </p>
      </header>

      <Separator />

      <div className="space-y-6">
        <Suspense fallback={<SlackSettingsSkeleton />}>
          <SlackSettingsCard />
        </Suspense>
        
        <Suspense fallback={<WebhookSettingsSkeleton />}>
          <WebhookSettingsCard />
        </Suspense>
      </div>
    </section>
  );
};

const SlackSettingsSkeleton = () => (
  <div className="rounded-lg border p-6">
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 w-28 animate-pulse rounded bg-muted" />
    </div>
  </div>
);

const WebhookSettingsSkeleton = () => (
  <div className="rounded-lg border p-6">
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 w-28 animate-pulse rounded bg-muted" />
    </div>
  </div>
);

export default Page;
