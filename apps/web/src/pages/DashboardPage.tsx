import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, Clock, MessageSquare,
  Smartphone, Users, ChevronRight, RefreshCw, TrendingUp
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/StatCard";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Summary {
  activeInstances: number;
  totalContacts: number;
  messagesSentToday: number;
  messagesQueued: number;
  deliveryRate: number;
  failedMessages: number;
}

interface RecentCampaign {
  id: string;
  name: string;
  status: string;
  recipients: number;
  createdAt: string;
}

interface QueueHealth {
  counts: { queued: number; sending: number; sent: number; failed: number };
}

export default function DashboardPage() {
  const { accessToken, workspaceId, workspaces, user } = useAuth();
  const token = accessToken ?? undefined;
  const workspaceName = workspaces[0]?.name ?? "Workspace";

  const [summary, setSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<RecentCampaign[]>([]);
  const [queue, setQueue] = useState<QueueHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return;
    const q = `workspaceId=${workspaceId}`;
    try {
      const [sumData, campData, queueData] = await Promise.all([
        apiFetch<Summary>(`/api/dashboard/summary?${q}`, { accessToken: token }),
        apiFetch<RecentCampaign[]>(`/api/dashboard/recent-campaigns?${q}`, { accessToken: token }),
        apiFetch<QueueHealth>(`/api/dashboard/queue-snapshot?${q}`, { accessToken: token })
      ]);
      setSummary(sumData);
      setCampaigns(campData);
      setQueue(queueData);
    } catch {
      /* silently ignore — partial data is fine */
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refresh every 30s while page is open
  useEffect(() => {
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const now = new Date().toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Welcome Back, {user?.name || user?.email?.split('@')[0] || 'there'} 👋</h1>
          <p className="page-subtitle">
            {workspaceName} · {now}
          </p>
        </div>
        <button onClick={fetchAll} className="btn-ghost h-8 w-8 p-0" title="Refresh">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard
          label="Active Instances"
          value={loading ? "…" : String(summary?.activeInstances ?? 0)}
          icon={Smartphone}
          tone="accent"
        />
        <StatCard
          label="Total Contacts"
          value={loading ? "…" : (summary?.totalContacts ?? 0).toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Sent Today"
          value={loading ? "…" : (summary?.messagesSentToday ?? 0).toLocaleString()}
          icon={MessageSquare}
        />
        <StatCard
          label="Queued"
          value={loading ? "…" : String(summary?.messagesQueued ?? 0)}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Delivery Rate"
          value={loading ? "…" : `${summary?.deliveryRate ?? 0}%`}
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label="Failed"
          value={loading ? "…" : String(summary?.failedMessages ?? 0)}
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Recent campaigns */}
        <div className="card-flat p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Campaigns</h2>
            <Link to="/campaigns" className="text-2xs text-accent-500 hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="mt-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-ink-100/80 dark:bg-white/10" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="mt-6 text-center text-sm text-ink-400">No campaigns yet.</div>
          ) : (
            <ul className="mt-3 space-y-1">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/campaigns/${c.id}`}
                    className="group flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-ink-50/80 dark:hover:bg-white/10"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-ink-700 dark:text-ink-100">
                        {c.name}
                      </div>
                      <div className="text-2xs text-ink-400">
                        {c.recipients.toLocaleString()} recipients
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <StatusBadge status={c.status} pulse={c.status === "running"} />
                      <ChevronRight size={11} className="text-ink-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Queue health */}
        <div className="card-flat p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Queue Health</h2>
            <Link to="/queue" className="text-2xs text-accent-500 hover:underline">Monitor</Link>
          </div>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-ink-100/80 dark:bg-white/10" />
              ))}
            </div>
          ) : (
            <dl className="mt-3 space-y-2">
              {[
                { label: "Queued", value: queue?.counts.queued ?? 0, dot: "bg-amber-500" },
                { label: "Sending", value: queue?.counts.sending ?? 0, dot: "bg-blue-500" },
                { label: "Sent (lifetime)", value: queue?.counts.sent ?? 0, dot: "bg-green-500" },
                { label: "Failed", value: queue?.counts.failed ?? 0, dot: "bg-red-500" }
              ].map(({ label, value, dot }) => (
                <div key={label} className="flex items-center justify-between text-[13px]">
                  <dt className="flex items-center gap-1.5 text-ink-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </dt>
                  <dd className="font-mono font-medium tabular-nums text-ink-700 dark:text-ink-200">
                    {value.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Delivery summary */}
        <div className="card-flat p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Today's Performance</h2>
            <Link to="/analytics" className="text-2xs text-accent-500 hover:underline">Analytics</Link>
          </div>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-ink-100/80 dark:bg-white/10" />
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-ink-400">Delivery rate</span>
                  <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                    {summary?.deliveryRate ?? 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-700"
                    style={{ width: `${summary?.deliveryRate ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg bg-ink-50/60 p-2 text-center dark:bg-white/5">
                  <div className="text-lg font-semibold tabular-nums text-ink-800 dark:text-white">
                    {(summary?.messagesSentToday ?? 0).toLocaleString()}
                  </div>
                  <div className="text-2xs text-ink-400">Sent today</div>
                </div>
                <div className="rounded-lg bg-red-50/60 p-2 text-center dark:bg-red-500/5">
                  <div className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
                    {(summary?.failedMessages ?? 0).toLocaleString()}
                  </div>
                  <div className="text-2xs text-ink-400">Failed</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-2xs text-ink-400">
                <TrendingUp size={11} />
                Refreshes every 30 seconds
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
