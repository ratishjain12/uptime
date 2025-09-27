"use client";

import { Activity, Map as MapIcon, MessageCircle } from "lucide-react";
import DottedMap from "dotted-map";
import { Area, AreaChart, CartesianGrid } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const map = new DottedMap({ height: 60, grid: "diagonal" });
const points = map.getPoints();

const chartConfig = {
  downtime: {
    label: "Downtime (min)",
    color: "#ef4444",
  },
  resolution: {
    label: "Median response (min)",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const chartData = [
  { month: "May", downtime: 18, resolution: 8 },
  { month: "June", downtime: 12, resolution: 13 },
  { month: "July", downtime: 26, resolution: 48 },
  { month: "August", downtime: 9, resolution: 31 },
  { month: "September", downtime: 6, resolution: 24 },
  { month: "October", downtime: 30, resolution: 18 },
];

const svgOptions = {
  backgroundColor: "var(--color-background)",
  color: "hsl(var(--primary)/0.6)",
  radius: 0.4,
};

const Map = () => {
  const viewBox = "0 0 120 60";
  return (
    <svg
      viewBox={viewBox}
      className="h-full w-full"
      style={{ background: svgOptions.backgroundColor }}
    >
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={svgOptions.radius}
          fill={svgOptions.color}
        />
      ))}
    </svg>
  );
};

const MonitoringChart = () => {
  return (
    <ChartContainer
      className="h-80 w-full aspect-auto md:h-96"
      config={chartConfig}
    >
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 0,
          right: 0,
        }}
      >
        <defs>
          <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-desktop)"
              stopOpacity={0.8}
            />
            <stop
              offset="60%"
              stopColor="var(--color-desktop)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-mobile)"
              stopOpacity={0.8}
            />
            <stop
              offset="60%"
              stopColor="var(--color-mobile)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent className="dark:bg-muted" />}
        />
        <Area
          strokeWidth={2}
          dataKey="resolution"
          type="monotone"
          fill="url(#fillDesktop)"
          fillOpacity={0.2}
          stroke="var(--color-resolution)"
        />
        <Area
          strokeWidth={2}
          dataKey="downtime"
          type="monotone"
          fill="url(#fillMobile)"
          fillOpacity={0.2}
          stroke="var(--color-downtime)"
        />
      </AreaChart>
    </ChartContainer>
  );
};

const Features = () => {
  return (
    <section className="px-4 py-16 md:py-24" id="features">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border bg-background shadow-sm md:grid-cols-2">
        <div className="flex flex-col">
          <div className="p-6 sm:p-12">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapIcon className="size-4" />
              Website downtime alerting
            </span>
            <p className="mt-6 text-2xl font-semibold sm:text-3xl">
              Multi-region pings watch your URLs every minute.
            </p>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              When a check fails we trace the outage back to the affected
              location, start failover, and send the alert within seconds.
            </p>
          </div>
          <div aria-hidden className="relative h-64 border-t sm:h-72">
            <div className="absolute inset-x-0 top-6 z-10 mx-auto flex w-fit flex-col items-center gap-2 text-xs font-medium">
              <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 shadow-md shadow-black/10">
                <span className="text-base">🇸🇬</span>
                Ping failure · api.statuspage.dev
              </div>
              <div className="rounded-[--radius] border bg-background px-3 py-2 text-muted-foreground shadow">
                Auto failover: Singapore ➝ Frankfurt
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-transparent" />
            <div className="absolute inset-0">
              <Map />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between border-t bg-muted/40 p-6 sm:p-12 md:border-l md:border-t-0 md:bg-transparent">
          <div>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="size-4" />
              Slack & email alerts
            </span>
            <p className="my-6 text-2xl font-semibold sm:text-3xl">
              Escalate to channels your team already lives in.
            </p>
            <p className="text-sm text-muted-foreground sm:text-base">
              Configure who gets notified, add quiet hours, and define backup
              routes so no outage slips through.
            </p>
          </div>

          <div
            aria-hidden
            className="mt-8 flex flex-col gap-6 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full border">
                <span className="size-3 rounded-full bg-primary" />
              </span>
              <span className="text-muted-foreground">
                Slack · #site-incidents
              </span>
            </div>
            <div className="w-full max-w-xs rounded-[--radius] border bg-background p-3 text-left shadow">
              Downtime detected for checkout — 4m average response.
            </div>
            <div className="ml-auto w-full max-w-xs rounded-[--radius] bg-primary px-3 py-3 text-left text-background shadow">
              On-call acknowledged · rerouting traffic now.
            </div>
            <span className="self-end text-muted-foreground">1m ago</span>
          </div>
        </div>

        <div className="col-span-full border-t bg-gradient-to-br from-background via-background to-primary/5 p-12 text-center">
          <p className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            99.99% Uptime
          </p>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Customers ship faster because we catch issues before users do.
          </p>
        </div>

        <div className="relative col-span-full overflow-hidden border-t">
          <div className="absolute inset-0 z-10 max-w-lg px-6 py-8 sm:px-12 sm:py-12">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="size-4" />
              Downtime history & MTTR trends
            </span>
            <p className="mt-6 text-2xl font-semibold sm:text-3xl">
              Monthly downtime snapshots at a glance.
              <span className="block text-muted-foreground">
                Compare outage minutes with median response time.
              </span>
            </p>
          </div>
          <MonitoringChart />
        </div>
      </div>
    </section>
  );
};

export default Features;
