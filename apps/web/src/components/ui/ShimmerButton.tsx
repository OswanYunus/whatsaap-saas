import type { ReactNode } from "react";

interface ShimmerButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

export default function ShimmerButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  loading = false
}: ShimmerButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2 overflow-hidden
        rounded-xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white
        shadow-sm transition-all duration-200
        hover:bg-accent-600 hover:shadow-md active:scale-[0.97]
        disabled:pointer-events-none disabled:opacity-50
        ${className}
      `}
    >
      {/* Shimmer overlay */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{ animationPlayState: disabled || loading ? "paused" : "running" }}
      />
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Please wait…</span>
        </>
      ) : children}
    </button>
  );
}
