import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from "recharts";
import { RefreshCw, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const PIE_COLORS = ["#EF4444", "#F59E0B", "#6366F1", "#22C55E", "#71717A"];
const CHART_GRID = "rgba(0,0,0,0.05)";
const CHART_TICK = "#71717A";
const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
};

function ChartCard({ title, children, loading }: { title: string; children: ReactNode; loading?: boolean }) {
  return (
    <div className="card-flat p-4">
      <h2 className="section-title mb-3">{title}</h2>
      <div className="h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          </div>
        ) : children}
      </div>
    </div>
  );
}

type DayRange = 7 | 14 | 30;

interface MessagePoint { date: string; sent: number; delivered: number; failed: number; }
interface CampaignPoint { name: string; messages: number; }
interface FailurePoint { reason: string; count: number; }

export default function AnalyticsPage() {
  const { accessToken, workspaceId } = useAuth();
  const token = accessToken ?? undefined;

  const [days, setDays] = useState<DayRange>(7);
  const [timeSeries, setTimeSeries] = useState<MessagePoint[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<CampaignPoint[]>([]);
  const [failureReasons, setFailureReasons] = useState<FailurePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(false);
    const q = `workspaceId=${workspaceId}`;
    try {
      const [ts, top, failures] = await Promise.all([
        apiFetch<MessagePoint[]>(`/api/dashboard/messages-over-time?${q}&days=${days}`, { accessToken: token }),
        apiFetch<CampaignPoint[]>(`/api/dashboard/top-campaigns?${q}`, { accessToken: token }),
        apiFetch<FailurePoint[]>(`/api/dashboard/failure-reasons?${q}`, { accessToken: token })
      ]);
      setTimeSeries(ts);
      setTopCampaigns(top);
      setFailureReasons(failures);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token, days]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deliveryRateSeries = timeSeries.map((d) => ({
    date: d.date,
    rate: d.sent === 0 ? 0 : Number(((d.delivered / d.sent) * 100).toFixed(1))
  }));

  const totalSent = timeSeries.reduce((s, d) => s + d.sent, 0);
  const totalDelivered = timeSeries.reduce((s, d) => s + d.delivered, 0);
  const totalFailed = timeSeries.reduce((s, d) => s + d.failed, 0);
  const overallRate = totalSent === 0 ? 0 : Math.round((totalDelivered / totalSent) * 1000) / 10;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Delivery performance across all campaigns.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-ink-100/80 dark:border-white/10">
            {([7, 14, 30] as DayRange[]).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-2xs font-medium transition-colors ${
                  days === d
                    ? "bg-accent-500 text-white"
                    : "text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
                } ${d === 7 ? "rounded-l-md" : d === 30 ? "rounded-r-md" : ""}`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button onClick={fetchAll} className="btn-ghost h-8 w-8 p-0" title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          <AlertCircle size={14} /> Failed to load analytics.
          <button onClick={fetchAll} className="ml-auto text-2xs underline">Retry</button>
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: `Sent (${days}d)`, value: totalSent.toLocaleString(), color: "text-ink-700 dark:text-ink-200" },
          { label: "Delivered", value: totalDelivered.toLocaleString(), color: "text-green-600 dark:text-green-400" },
          { label: "Failed", value: totalFailed.toLocaleString(), color: "text-red-600 dark:text-red-400" },
          { label: "Delivery rate", value: `${overallRate}%`, color: overallRate > 80 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400" },
        ].map((tile) => (
          <div key={tile.label} className="card-flat p-3 text-center">
            <div className={`text-2xl font-bold tabular-nums ${tile.color}`}>{loading ? "…" : tile.value}</div>
            <div className="mt-0.5 text-2xs text-ink-400">{tile.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="Messages Over Time" loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_TICK }} tickLine={false} axisLine={false} dy={4} />
              <YAxis tick={{ fontSize: 11, fill: CHART_TICK }} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sent" stroke="#6366F1" strokeWidth={2} dot={false} name="Sent" />
              <Line type="monotone" dataKey="delivered" stroke="#22C55E" strokeWidth={2} dot={false} name="Delivered" />
              <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Delivery Rate (${days}d)`} loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deliveryRateSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_TICK }} tickLine={false} axisLine={false} dy={4} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: CHART_TICK }} tickLine={false} axisLine={false} width={36} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2} dot={{ r: 2, fill: "#22C55E", strokeWidth: 0 }} name="Delivery rate" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Failure Reasons" loading={loading}>
          {failureReasons.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-400">
              No failures recorded 🎉
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={failureReasons} dataKey="count" nameKey="reason" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                  {failureReasons.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Most Active Campaigns" loading={loading}>
          {topCampaigns.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-400">
              No campaigns yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCampaigns} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: CHART_TICK }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: CHART_TICK }} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="messages" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={14} name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
