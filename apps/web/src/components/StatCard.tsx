import type { ElementType } from "react";
import SpotlightCard from "./ui/SpotlightCard";
import AnimatedCounter from "./ui/AnimatedCounter";

interface StatCardProps {
  label: string;
  value: string;
  icon: ElementType;
  tone?: "default" | "accent" | "warning" | "danger" | "info";
  suffix?: string;
}

const toneMap = {
  default: {
    icon: "bg-ink-100 text-ink-500 dark:bg-white/[0.08] dark:text-ink-400",
    value: "text-ink-900 dark:text-white"
  },
  accent: {
    icon: "bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400",
    value: "text-accent-700 dark:text-accent-400"
  },
  warning: {
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-400"
  },
  danger: {
    icon: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    value: "text-red-600 dark:text-red-400"
  },
  info: {
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-400"
  }
};

export default function StatCard({ label, value, icon: Icon, tone = "default", suffix }: StatCardProps) {
  const styles = toneMap[tone];
  const isNumeric = !isNaN(Number(value.replace(/[%,]/g, "")));
  const numericValue = isNumeric ? Number(value.replace(/[%,]/g, "")) : null;
  const isSuffix = value.endsWith("%") ? "%" : (suffix ?? "");

  return (
    <SpotlightCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
          <Icon size={17} strokeWidth={2} />
        </div>
      </div>
      <div className="mt-4">
        <div className={`stat-number ${styles.value}`}>
          {value === "…" ? (
            <span className="skeleton inline-block h-8 w-16 rounded-lg" />
          ) : isNumeric && numericValue !== null ? (
            <AnimatedCounter value={numericValue} suffix={isSuffix} />
          ) : (
            value
          )}
        </div>
        <p className="stat-label mt-1">{label}</p>
      </div>
    </SpotlightCard>
  );
}
