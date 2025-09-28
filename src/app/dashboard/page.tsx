import { Suspense } from "react";

import { AddMonitorModal } from "@/components/dashboard/modal";
import { getMonitors } from "@/actions/monitor";
import { Separator } from "@/components/ui/separator";
import { MonitorCard } from "@/components/dashboard/monitor-card";

const getData = async () => {
  const monitors = await getMonitors();
  return monitors;
};

const DashboardMonitors = async () => {
  const monitors = await getData();

  if (!monitors.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground mb-4">
          You have not added any monitors yet.
        </p>
        <AddMonitorModal />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {monitors.map((monitor) => (
          <MonitorCard key={monitor.id} monitor={monitor} />
        ))}
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <section className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Monitor the health of your websites in real time.
          </p>
        </div>
        <Suspense fallback={<AddMonitorModal />}>
          <AddMonitorModal />
        </Suspense>
      </header>

      <Separator />

      <Suspense
        fallback={
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Loading monitors...
          </div>
        }
      >
        <DashboardMonitors />
      </Suspense>
    </section>
  );
};

export default Page;
