import { useState, useEffect, useCallback } from "react";
import { Inbox, RefreshCw, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface QueueMessage {
  id: string;
  contact: string;
  phone: string;
  campaign: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  failureReason: string | null;
}

interface QueueSnapshot {
  counts: { queued: number; sending: number; sent: number; failed: number };
  messages: QueueMessage[];
}

const COLUMNS: { status: string; label: string; dot: string; countKey: keyof QueueSnapshot["counts"] }[] = [
  { status: "queued", label: "Queued", dot: "bg-amber-500", countKey: "queued" },
  { status: "sending", label: "Sending", dot: "bg-blue-500", countKey: "sending" },
  { status: "sent", label: "Sent", dot: "bg-green-500", countKey: "sent" },
  { status: "failed", label: "Failed", dot: "bg-red-500", countKey: "failed" }
];

function timeAgo(iso: string) {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function QueueMonitorPage() {
  const { accessToken, workspaceId } = useAuth();
  const token = accessToken ?? undefined;

  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLive, setIsLive] = useState(true);

  const fetchSnapshot = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await apiFetch<QueueSnapshot>(
        `/api/dashboard/queue-snapshot?workspaceId=${workspaceId}`,
        { accessToken: token }
      );
      setSnapshot(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => { fetchSnapshot(); }, [fetchSnapshot]);

  // Live refresh every 5s when live mode is on
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(fetchSnapshot, 5000);
    return () => clearInterval(t);
  }, [isLive, fetchSnapshot]);

  const counts = snapshot?.counts ?? { queued: 0, sending: 0, sent: 0, failed: 0 };
  const messages = snapshot?.messages ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Queue Monitor</h1>
          <p className="page-subtitle">Live view of message delivery stages.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSnapshot} className="btn-ghost h-8 w-8 p-0" title="Refresh now">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setIsLive((v) => !v)} className="live-badge">
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse bg-accent-500" : "bg-ink-400"}`} />
            {isLive ? "Live" : "Paused"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          <AlertCircle size={14} /> Failed to load queue.
          <button onClick={fetchSnapshot} className="ml-auto text-2xs underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = messages.filter((m) => m.status === col.status);
          const colCount = col.status === "sent"
            ? counts[col.countKey]  // use DB total for sent, not just recent 60
            : items.length;

          return (
            <div key={col.status} className="kanban-col">
              <div className="kanban-col-header">
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-700 dark:text-ink-200">
                  <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                  {col.label}
                </div>
                <span className="font-mono text-2xs tabular-nums text-ink-400">
                  {loading ? "…" : colCount.toLocaleString()}
                </span>
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto p-2" style={{ maxHeight: "60vh" }}>
                {loading ? (
                  <div className="space-y-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-ink-100/80 dark:bg-white/10" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="empty-state py-8">
                    <div className="empty-state-icon h-8 w-8">
                      <Inbox size={14} strokeWidth={1.75} />
                    </div>
                    <p className="empty-state-title">Empty</p>
                  </div>
                ) : (
                  items.map((m) => (
                    <div key={m.id} className="kanban-card">
                      <div className="truncate font-medium text-ink-700 dark:text-ink-200">
                        {m.contact || m.phone}
                      </div>
                      <div className="truncate text-2xs text-ink-400">{m.campaign}</div>
                      {m.failureReason && (
                        <div className="mt-1 truncate rounded bg-red-50 px-1.5 py-0.5 text-2xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
                          {m.failureReason}
                        </div>
                      )}
                      <div className="mt-1 text-2xs text-ink-300 dark:text-ink-500">
                        {timeAgo(m.sentAt ?? m.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
