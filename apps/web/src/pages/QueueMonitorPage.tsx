import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { queueMessages as initialMessages, type MessageStatus, type QueueMessage } from "../lib/mockData";

const COLUMNS: { status: MessageStatus; label: string; dot: string }[] = [
  { status: "queued", label: "Queued", dot: "bg-amber-500" },
  { status: "processing", label: "Processing", dot: "bg-blue-500" },
  { status: "sent", label: "Sent", dot: "bg-accent-500" },
  { status: "failed", label: "Failed", dot: "bg-red-500" }
];

const NEXT_STATUS: Partial<Record<MessageStatus, MessageStatus>> = {
  queued: "processing",
  processing: "sent"
};

/**
 * Queue Monitor — a live board of in-flight messages grouped by
 * status. "Live" here means an in-memory simulation that nudges
 * random jobs forward every couple of seconds, standing in for the
 * real BullMQ job events. Once the worker is wired up, replace the
 * setInterval below with a WebSocket/SSE subscription to
 * queue.events (waiting/active/completed/failed) and drop items into
 * these same columns as they arrive.
 */
export default function QueueMonitorPage() {
  const [messages, setMessages] = useState<QueueMessage[]>(initialMessages);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMessages((prev) => {
        const movable = prev.filter((m) => NEXT_STATUS[m.status]);
        if (movable.length === 0) return prev;
        const target = movable[Math.floor(Math.random() * movable.length)];
        return prev.map((m) =>
          m.id === target.id ? { ...m, status: NEXT_STATUS[m.status]! } : m
        );
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Queue</h1>
          <p className="page-subtitle">Messages grouped by delivery stage.</p>
        </div>
        <button onClick={() => setIsLive((v) => !v)} className="live-badge">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-accent-500 animate-pulse" : "bg-ink-400"}`}
          />
          {isLive ? "Live" : "Paused"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = messages.filter((m) => m.status === col.status);
          return (
            <div key={col.status} className="kanban-col">
              <div className="kanban-col-header">
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-700 dark:text-ink-200">
                  <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                  {col.label}
                </div>
                <span className="font-mono text-2xs tabular-nums text-ink-400">{items.length}</span>
              </div>
              <div className="flex-1 space-y-1.5 p-2">
                {items.length === 0 && (
                  <div className="empty-state py-8">
                    <div className="empty-state-icon h-8 w-8">
                      <Inbox size={14} strokeWidth={1.75} />
                    </div>
                    <p className="empty-state-title">Empty</p>
                  </div>
                )}
                {items.map((m) => (
                  <div key={m.id} className="kanban-card">
                    <div className="font-mono font-medium tabular-nums text-ink-700 dark:text-ink-200">
                      {m.contact}
                    </div>
                    <div className="mt-0.5 truncate text-ink-400">{m.campaign}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
