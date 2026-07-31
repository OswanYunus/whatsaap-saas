import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Megaphone, Plus, Play, Pause, Trash2,
  Users, Tag, Globe, Send, ChevronRight,
  Clock, CheckCircle2, XCircle, BarChart2, AlertCircle
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface CampaignAnalytics {
  total: number;
  queued: number;
  sending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  cancelled: number;
  retrying: number;
  progress: number;
  estimatedRemainingSeconds: number;
}

interface Campaign {
  id: string;
  name: string;
  notes: string | null;
  instanceId: string;
  messageTemplate: string;
  status: string;
  audienceType: string;
  audienceGroupName: string | null;
  audienceTags: string[];
  scheduledAt: string | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  analytics: CampaignAnalytics;
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value === 100
      ? "bg-green-500"
      : value > 50
      ? "bg-accent-500"
      : "bg-accent-400";
  return (
    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function AudiencePill({
  type,
  groupName,
  tags
}: {
  type: string;
  groupName?: string | null;
  tags?: string[];
}) {
  if (type === "GROUP" && groupName) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-2xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Users size={10} /> {groupName}
      </span>
    );
  }
  if (type === "TAGS" && tags && tags.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-2xs font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
        <Tag size={10} /> {tags.slice(0, 2).join(", ")}
        {tags.length > 2 ? ` +${tags.length - 2}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-2xs font-medium text-ink-500 dark:bg-white/10 dark:text-ink-400">
      <Globe size={10} /> All contacts
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card-flat flex items-center gap-3 p-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}
      >
        <Icon size={14} strokeWidth={2} />
      </div>
      <div>
        <div className="text-lg font-semibold tabular-nums text-ink-800 dark:text-white">
          {value}
        </div>
        <div className="text-2xs text-ink-400">{label}</div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { accessToken, workspaceId } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setError(null);
      const data = await apiFetch<Campaign[]>(
        `/api/campaigns?workspaceId=${workspaceId}`,
        { accessToken: accessToken ?? undefined }
      );
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, accessToken]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Auto-refresh every 8s when any campaign is RUNNING
  useEffect(() => {
    if (!campaigns.some((c) => c.status === "RUNNING")) return;
    const timer = setInterval(fetchCampaigns, 8000);
    return () => clearInterval(timer);
  }, [campaigns, fetchCampaigns]);

  const callAction = async (
    fn: () => Promise<void>,
    id: string
  ) => {
    setActionLoading(id);
    try {
      await fn();
      await fetchCampaigns();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDispatch = (id: string) =>
    callAction(
      () =>
        apiFetch(`/api/campaigns/${id}/dispatch`, {
          method: "POST",
          accessToken: accessToken ?? undefined
        }),
      id
    );

  const handlePause = (id: string) =>
    callAction(
      () =>
        apiFetch(`/api/campaigns/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "PAUSED" }),
          accessToken: accessToken ?? undefined
        }),
      id
    );

  const handleResume = (id: string) =>
    callAction(
      () =>
        apiFetch(`/api/campaigns/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "RUNNING" }),
          accessToken: accessToken ?? undefined
        }),
      id
    );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return;
    callAction(
      async () => {
        await apiFetch(`/api/campaigns/${id}`, {
          method: "DELETE",
          accessToken: accessToken ?? undefined
        });
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      },
      id
    );
  };

  const total = campaigns.length;
  const active = campaigns.filter((c) => c.status === "RUNNING").length;
  const completed = campaigns.filter((c) => c.status === "COMPLETED").length;
  const failed = campaigns.filter((c) => c.status === "FAILED").length;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="page-header">
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Create and monitor bulk message campaigns.</p>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">
            Create and monitor bulk WhatsApp message campaigns.
          </p>
        </div>
        <button onClick={() => navigate("/campaigns/new")} className="btn-accent shrink-0">
          <Plus size={14} strokeWidth={2} /> New campaign
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={total} icon={Megaphone} color="bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300" />
        <StatCard label="Active now" value={active} icon={Send} color="bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} color="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" />
        <StatCard label="Failed" value={failed} icon={XCircle} color="bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          <AlertCircle size={14} />
          {error}
          <button onClick={fetchCampaigns} className="ml-auto text-2xs underline">
            Retry
          </button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="card-flat">
          <div className="empty-state py-20">
            <div className="empty-state-icon">
              <Megaphone size={16} strokeWidth={1.75} />
            </div>
            <p className="empty-state-title">No campaigns yet</p>
            <p className="empty-state-desc">
              Create your first campaign to start sending bulk messages.
            </p>
            <button onClick={() => navigate("/campaigns/new")} className="btn-accent mt-4">
              <Plus size={14} strokeWidth={2} /> New campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Audience</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="table-row group">
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <Link
                        to={`/campaigns/${c.id}`}
                        className="font-medium text-ink-800 transition-colors hover:text-accent-500 dark:text-white dark:hover:text-accent-400"
                      >
                        {c.name}
                        <ChevronRight
                          size={12}
                          className="ml-0.5 inline opacity-0 transition-opacity group-hover:opacity-60"
                        />
                      </Link>
                      {c.isRecurring && (
                        <span className="inline-flex w-fit items-center gap-1 text-2xs text-ink-400">
                          <Clock size={9} /> Recurring
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <AudiencePill
                      type={c.audienceType}
                      groupName={c.audienceGroupName}
                      tags={c.audienceTags}
                    />
                  </td>
                  <td className="font-mono tabular-nums text-ink-500 dark:text-ink-400">
                    {c.analytics.total.toLocaleString()}
                  </td>
                  <td>
                    <StatusBadge
                      status={c.status.toLowerCase()}
                      pulse={c.status === "RUNNING"}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={c.analytics.progress} />
                      <span className="font-mono text-2xs tabular-nums text-ink-400">
                        {c.analytics.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="text-ink-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-0.5">
                      {c.status === "DRAFT" && (
                        <button
                          onClick={() => handleDispatch(c.id)}
                          disabled={actionLoading === c.id}
                          className="btn-ghost h-7 w-7 p-0 text-green-600 hover:text-green-700 dark:text-green-400"
                          title="Send now"
                          aria-label="Dispatch campaign"
                        >
                          <Send size={13} strokeWidth={1.75} />
                        </button>
                      )}
                      {c.status === "RUNNING" && (
                        <button
                          onClick={() => handlePause(c.id)}
                          disabled={actionLoading === c.id}
                          className="btn-ghost h-7 w-7 p-0"
                          aria-label="Pause campaign"
                        >
                          <Pause size={13} strokeWidth={1.75} />
                        </button>
                      )}
                      {c.status === "PAUSED" && (
                        <button
                          onClick={() => handleResume(c.id)}
                          disabled={actionLoading === c.id}
                          className="btn-ghost h-7 w-7 p-0 text-green-600 dark:text-green-400"
                          aria-label="Resume campaign"
                        >
                          <Play size={13} strokeWidth={1.75} />
                        </button>
                      )}
                      <Link
                        to={`/campaigns/${c.id}`}
                        className="btn-ghost flex h-7 w-7 items-center justify-center p-0"
                        title="Analytics"
                        aria-label="View analytics"
                      >
                        <BarChart2 size={13} strokeWidth={1.75} />
                      </Link>
                      {(c.status === "DRAFT" ||
                        c.status === "CANCELLED" ||
                        c.status === "COMPLETED" ||
                        c.status === "FAILED") && (
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={actionLoading === c.id}
                          className="btn-ghost h-7 w-7 p-0 hover:text-red-600 dark:hover:text-red-400"
                          aria-label="Delete campaign"
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
