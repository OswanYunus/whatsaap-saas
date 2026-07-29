import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Smartphone } from "lucide-react";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import {
  dashboardSummary,
  queueHealth,
  recentActivity,
  recentCampaigns
} from "../lib/mockData";

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Workspace overview and live activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Active Instances"
          value={String(dashboardSummary.activeInstances)}
          icon={Smartphone}
          tone="accent"
        />
        <StatCard
          label="Sent Today"
          value={dashboardSummary.messagesSentToday.toLocaleString()}
          icon={MessageSquare}
        />
        <StatCard
          label="Queued"
          value={String(dashboardSummary.messagesQueued)}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Delivery Rate"
          value={`${dashboardSummary.deliveryRate}%`}
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label="Failed"
          value={String(dashboardSummary.failedMessages)}
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="card-flat p-4 lg:col-span-1">
          <h2 className="section-title">Recent Campaigns</h2>
          <ul className="mt-3 space-y-2">
            {recentCampaigns.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 transition-colors duration-150 hover:bg-ink-50/80 dark:hover:bg-white/10"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink-700 dark:text-ink-100">
                    {c.name}
                  </div>
                  <div className="text-2xs text-ink-400">{c.recipients.toLocaleString()} recipients</div>
                </div>
                <StatusBadge status={c.status} pulse={c.status === "running"} />
              </li>
            ))}
          </ul>
        </div>

        <div className="card-flat p-4 lg:col-span-1">
          <h2 className="section-title">Recent Activity</h2>
          <ul className="mt-3 space-y-3">
            {recentActivity.map((item) => (
              <li key={item.id} className="relative pl-3 before:absolute before:left-0 before:top-1.5 before:h-1 before:w-1 before:rounded-full before:bg-ink-300 dark:before:bg-ink-600">
                <p className="text-[13px] leading-snug text-ink-700 dark:text-ink-200">{item.message}</p>
                <p className="mt-0.5 text-2xs text-ink-400">{item.timestamp}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-flat p-4 lg:col-span-1">
          <h2 className="section-title">Queue Health</h2>
          <dl className="mt-3 space-y-2">
            {[
              { label: "Queued", value: queueHealth.queued },
              { label: "Processing", value: queueHealth.processing },
              { label: "Throughput", value: `${queueHealth.throughputPerMinute}/min` },
              { label: "Oldest job", value: `${queueHealth.oldestJobAgeSeconds}s` }
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-[13px]">
                <dt className="text-ink-400">{label}</dt>
                <dd className="font-mono font-medium tabular-nums text-ink-700 dark:text-ink-200">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
