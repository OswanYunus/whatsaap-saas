type Tone = "green" | "gray" | "amber" | "red" | "blue";

const toneStyles: Record<Tone, string> = {
  green: "bg-accent-500/10 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400",
  gray: "bg-ink-100/80 text-ink-500 dark:bg-white/10 dark:text-ink-400",
  amber: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  blue: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
};

const dotStyles: Record<Tone, string> = {
  green: "bg-accent-500",
  gray: "bg-ink-400",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500"
};

/**
 * Maps a domain status string to a display tone. Centralized here so
 * every table (instances, campaigns, queue) renders statuses
 * consistently instead of each page picking its own colors.
 */
const STATUS_TONE: Record<string, Tone> = {
  connected: "green",
  sent: "green",
  completed: "green",
  connecting: "amber",
  queued: "amber",
  scheduled: "amber",
  paused: "amber",
  processing: "blue",
  running: "blue",
  disconnected: "gray",
  draft: "gray",
  logged_out: "gray",
  failed: "red",

  // Uppercase database values
  CONNECTED: "green",
  CONNECTING: "amber",
  QR_WAITING: "amber",
  PAIRING_CODE: "blue",
  RECONNECTING: "amber",
  LOGGED_OUT: "gray",
  ERROR: "red",
  PENDING: "gray",
  DISCONNECTED: "gray"
};

export default function StatusBadge({ status, pulse = false }: { status: string; pulse?: boolean }) {
  const normalizedStatus = status ?? "";
  const tone = STATUS_TONE[normalizedStatus] ?? STATUS_TONE[normalizedStatus.toLowerCase()] ?? STATUS_TONE[normalizedStatus.toUpperCase()] ?? "gray";
  const label = normalizedStatus.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-medium capitalize ${toneStyles[tone]}`}
    >
      <span className={`h-1 w-1 rounded-full ${dotStyles[tone]} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}
