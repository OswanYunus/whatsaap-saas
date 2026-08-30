interface StatusBadgeProps {
  status: string;
  pulse?: boolean;
}

const statusMap: Record<string, { label: string; dot: string; badge: string }> = {
  connected:   { label: "Connected",   dot: "bg-accent-500",  badge: "badge-green" },
  active:      { label: "Active",      dot: "bg-accent-500",  badge: "badge-green" },
  running:     { label: "Running",     dot: "bg-accent-500",  badge: "badge-green" },
  completed:   { label: "Completed",   dot: "bg-blue-500",    badge: "badge-blue" },
  sent:        { label: "Sent",        dot: "bg-blue-500",    badge: "badge-blue" },
  scheduled:   { label: "Scheduled",  dot: "bg-amber-500",   badge: "badge-amber" },
  queued:      { label: "Queued",     dot: "bg-amber-500",   badge: "badge-amber" },
  paused:      { label: "Paused",     dot: "bg-amber-500",   badge: "badge-amber" },
  pending:     { label: "Pending",    dot: "bg-amber-400",   badge: "badge-amber" },
  failed:      { label: "Failed",     dot: "bg-red-500",     badge: "badge-red" },
  error:       { label: "Error",      dot: "bg-red-500",     badge: "badge-red" },
  disconnected:{ label: "Disconnected",dot: "bg-ink-400",    badge: "badge-gray" },
  inactive:    { label: "Inactive",   dot: "bg-ink-400",     badge: "badge-gray" },
  draft:       { label: "Draft",      dot: "bg-ink-400",     badge: "badge-gray" },
};

export default function StatusBadge({ status, pulse = false }: StatusBadgeProps) {
  const key = status?.toLowerCase() ?? "";
  const config = statusMap[key] ?? { label: status, dot: "bg-ink-400", badge: "badge-gray" };

  return (
    <span className={config.badge}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.dot} opacity-60`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
}
