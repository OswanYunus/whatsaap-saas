import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "accent" | "warning" | "danger";
  hint?: string;
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-ink-400 dark:text-ink-500",
  accent: "text-accent-600 dark:text-accent-400",
  warning: "text-amber-500 dark:text-amber-400",
  danger: "text-red-500 dark:text-red-400"
};

/** A single metric tile used across the Dashboard overview row. */
export default function StatCard({ label, value, icon: Icon, tone = "default", hint }: StatCardProps) {
  return (
    <div className="card-flat px-4 py-3 transition-colors duration-150 hover:border-ink-200/80 dark:hover:border-white/20">
      <div className="flex items-center gap-1.5">
        <Icon size={14} strokeWidth={1.75} className={toneStyles[tone]} />
        <span className="text-2xs font-medium uppercase tracking-wider text-ink-400 dark:text-ink-500">
          {label}
        </span>
      </div>
      <div className="mt-1.5 font-mono text-xl font-semibold tracking-tight text-ink-800 dark:text-white">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-2xs text-ink-400 dark:text-ink-500">{hint}</div>}
    </div>
  );
}
