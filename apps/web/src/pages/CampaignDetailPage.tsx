import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, Send, Pause, Play, XCircle, Trash2,
  CheckCircle2, AlertCircle, Clock, Users, Globe, Tag,
  MessageSquare, Settings2, Loader2,
  RefreshCw, CalendarClock
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
  avgSendRateMsgPerSec: number;
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
  timezone: string | null;
  isRecurring: boolean;
  cronExpression: string | null;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  maxPerMinute: number;
  footerEnabled: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  analytics: CampaignAnalytics;
}

function StatTile({
  label, value, icon: Icon, bg, text
}: {
  label: string; value: number; icon: React.ElementType; bg: string; text: string;
}) {
  return (
    <div className="card-flat flex flex-col gap-2 p-3">
      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bg}`}>
        <Icon size={13} strokeWidth={2} className={text} />
      </div>
      <div className="text-xl font-semibold tabular-nums text-ink-800 dark:text-white">
        {value.toLocaleString()}
      </div>
      <div className="text-2xs text-ink-400">{label}</div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-ink-100 dark:text-white/10" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={value === 100 ? "#22c55e" : "#6366f1"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold tabular-nums text-ink-800 dark:text-white">{value}%</div>
        <div className="text-2xs text-ink-400">done</div>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const token = accessToken ?? undefined;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiFetch<Campaign>(`/api/campaigns/${id}`, { accessToken: token });
      setCampaign(data);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  useEffect(() => {
    if (campaign?.status !== "RUNNING") return;
    const t = setInterval(fetchCampaign, 5000);
    return () => clearInterval(t);
  }, [campaign?.status, fetchCampaign]);

  const handleAction = async (action: "dispatch" | "pause" | "resume" | "cancel" | "delete") => {
    if (!campaign) return;
    if (action === "delete" && !confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;
    if (action === "cancel" && !confirm("Cancel this campaign? In-flight messages may still send.")) return;

    setActionLoading(action);
    try {
      if (action === "dispatch") {
        await apiFetch(`/api/campaigns/${campaign.id}/dispatch`, { method: "POST", accessToken: token });
      } else if (action === "pause") {
        await apiFetch(`/api/campaigns/${campaign.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "PAUSED" }), accessToken: token });
      } else if (action === "resume") {
        await apiFetch(`/api/campaigns/${campaign.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "RUNNING" }), accessToken: token });
      } else if (action === "cancel") {
        await apiFetch(`/api/campaigns/${campaign.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "CANCELLED" }), accessToken: token });
      } else if (action === "delete") {
        await apiFetch(`/api/campaigns/${campaign.id}`, { method: "DELETE", accessToken: token });
        navigate("/campaigns");
        return;
      }
      await fetchCampaign();
    } catch (err: any) {
      alert(err.message ?? "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const fmtDuration = (seconds: number) => {
    if (seconds <= 0) return "—";
    if (seconds < 60) return `~${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `~${m}m`;
    return `~${Math.floor(m / 60)}h ${m % 60}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-ink-400" />
      </div>
    );
  }

  if (error ?? !campaign) {
    return (
      <div className="space-y-4">
        <Link to="/campaigns" className="btn-ghost inline-flex items-center gap-1.5 text-sm">
          <ChevronLeft size={14} /> Back to campaigns
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          <AlertCircle size={14} /> {error ?? "Campaign not found"}
        </div>
      </div>
    );
  }

  const { analytics: a } = campaign;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/campaigns" className="btn-ghost mt-0.5 h-8 w-8 shrink-0 p-0">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="page-title">{campaign.name}</h1>
              <StatusBadge status={campaign.status.toLowerCase()} pulse={campaign.status === "RUNNING"} />
            </div>
            {campaign.notes && (
              <p className="mt-0.5 text-sm text-ink-400 italic">{campaign.notes}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <button onClick={fetchCampaign} className="btn-ghost h-8 w-8 p-0" title="Refresh">
            <RefreshCw size={13} />
          </button>
          {campaign.status === "DRAFT" && (
            <button onClick={() => handleAction("dispatch")} disabled={!!actionLoading} className="btn-accent gap-1.5">
              {actionLoading === "dispatch" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send now
            </button>
          )}
          {campaign.status === "RUNNING" && (
            <button onClick={() => handleAction("pause")} disabled={!!actionLoading} className="btn-outline gap-1.5">
              <Pause size={13} /> Pause
            </button>
          )}
          {campaign.status === "PAUSED" && (
            <button onClick={() => handleAction("resume")} disabled={!!actionLoading} className="btn-accent gap-1.5">
              <Play size={13} /> Resume
            </button>
          )}
          {(campaign.status === "RUNNING" || campaign.status === "PAUSED") && (
            <button onClick={() => handleAction("cancel")} disabled={!!actionLoading} className="btn-ghost gap-1.5 text-red-500 hover:text-red-600">
              <XCircle size={13} /> Cancel
            </button>
          )}
          {(campaign.status === "DRAFT" || campaign.status === "CANCELLED" || campaign.status === "COMPLETED" || campaign.status === "FAILED") && (
            <button onClick={() => handleAction("delete")} disabled={!!actionLoading} className="btn-ghost h-8 w-8 p-0 hover:text-red-600">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: analytics + message */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card-flat p-4">
            <h2 className="section-title mb-4">Analytics</h2>
            <div className="flex flex-wrap items-start gap-6">
              <ProgressRing value={a.progress} />
              <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
                <StatTile label="Total" value={a.total} icon={MessageSquare} bg="bg-ink-100 dark:bg-white/10" text="text-ink-500 dark:text-ink-400" />
                <StatTile label="Queued" value={a.queued} icon={Clock} bg="bg-amber-50 dark:bg-amber-500/10" text="text-amber-600 dark:text-amber-400" />
                <StatTile label="Sent" value={a.sent} icon={Send} bg="bg-blue-50 dark:bg-blue-500/10" text="text-blue-600 dark:text-blue-400" />
                <StatTile label="Delivered" value={a.delivered} icon={CheckCircle2} bg="bg-green-50 dark:bg-green-500/10" text="text-green-600 dark:text-green-400" />
                <StatTile label="Read" value={a.read} icon={CheckCircle2} bg="bg-emerald-50 dark:bg-emerald-500/10" text="text-emerald-600 dark:text-emerald-400" />
                <StatTile label="Failed" value={a.failed} icon={AlertCircle} bg="bg-red-50 dark:bg-red-500/10" text="text-red-600 dark:text-red-400" />
              </div>
            </div>

            {campaign.status === "RUNNING" && a.estimatedRemainingSeconds > 0 && (
              <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-ink-100/80 bg-ink-50/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                <Clock size={13} className="text-ink-400" />
                <span className="text-ink-500">Estimated remaining:</span>
                <span className="font-medium text-ink-800 dark:text-white">
                  {fmtDuration(a.estimatedRemainingSeconds)}
                </span>
              </div>
            )}
          </div>

          <div className="card-flat p-4">
            <h2 className="section-title mb-3 flex items-center gap-1.5">
              <MessageSquare size={14} /> Message
            </h2>
            <div className="rounded-lg bg-ink-50/60 p-3 dark:bg-white/5">
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink-700 dark:text-ink-200">
                {campaign.messageTemplate}
              </pre>
              {campaign.footerEnabled && (
                <p className="mt-2 border-t border-ink-100/60 pt-2 font-mono text-2xs text-ink-400 italic dark:border-white/10">
                  _Sent via Cerebro on behalf of your business._
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: metadata */}
        <div className="space-y-4">
          <div className="card-flat p-4">
            <h2 className="section-title mb-3 flex items-center gap-1.5">
              <Users size={14} /> Audience
            </h2>
            <div className="flex items-center gap-2 text-sm">
              {campaign.audienceType === "ALL" && <Globe size={13} className="text-ink-400" />}
              {campaign.audienceType === "GROUP" && <Users size={13} className="text-indigo-500" />}
              {campaign.audienceType === "TAGS" && <Tag size={13} className="text-purple-500" />}
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {campaign.audienceType === "ALL" && "All contacts"}
                {campaign.audienceType === "GROUP" && campaign.audienceGroupName}
                {campaign.audienceType === "TAGS" && campaign.audienceTags.join(", ")}
              </span>
            </div>
          </div>

          <div className="card-flat p-4">
            <h2 className="section-title mb-3 flex items-center gap-1.5">
              <CalendarClock size={14} /> Schedule
            </h2>
            <dl className="space-y-2 text-sm">
              {campaign.scheduledAt && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-2xs text-ink-400">Scheduled for</dt>
                  <dd className="font-medium text-ink-700 dark:text-ink-200">
                    {new Date(campaign.scheduledAt).toLocaleString()}
                    {campaign.timezone ? ` (${campaign.timezone})` : ""}
                  </dd>
                </div>
              )}
              {campaign.startedAt && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-2xs text-ink-400">Started</dt>
                  <dd className="font-medium text-ink-700 dark:text-ink-200">
                    {new Date(campaign.startedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {campaign.completedAt && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-2xs text-ink-400">Completed</dt>
                  <dd className="font-medium text-ink-700 dark:text-ink-200">
                    {new Date(campaign.completedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {!campaign.scheduledAt && !campaign.startedAt && (
                <p className="text-2xs text-ink-400">Not yet dispatched.</p>
              )}
            </dl>
          </div>

          <div className="card-flat p-4">
            <h2 className="section-title mb-3 flex items-center gap-1.5">
              <Settings2 size={14} /> Safety settings
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-400">Delay range</dt>
                <dd className="font-mono text-ink-700 dark:text-ink-200">
                  {campaign.minDelaySeconds}–{campaign.maxDelaySeconds}s
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-400">Max per minute</dt>
                <dd className="font-mono text-ink-700 dark:text-ink-200">{campaign.maxPerMinute}/min</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-400">Footer</dt>
                <dd className="text-ink-700 dark:text-ink-200">{campaign.footerEnabled ? "Enabled" : "Disabled"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
