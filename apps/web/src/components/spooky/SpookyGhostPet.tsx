import { useState } from "react";
import { playEerieChime } from "./SpookyAudio";
import { Sparkles, X, Flame } from "lucide-react";

const SEASONAL_INSIGHTS = [
  "High Engagement Period: October broadcasts see a 28% higher response rate for promotional campaigns.",
  "Instance Health: Keep sending intervals randomized between 3-7 seconds to maintain maximum WhatsApp trust score.",
  "Deliverability Tip: Include personalized first names in message variables to eliminate recipient spam reports.",
  "Template Strategy: Interactive quick-reply buttons yield 3x higher click-through rates than plain text.",
  "Scale Pro Tip: Multi-device load balancing allows high-volume campaigns without hitting daily SIM limits.",
];

export default function SpookyGhostPet() {
  const [isOpen, setIsOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const handleTrigger = (e: React.MouseEvent) => {
    playEerieChime();
    const rect = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("spooky-bat-burst", {
        detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      })
    );
    setTipIndex((prev) => (prev + 1) % SEASONAL_INSIGHTS.length);
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end select-none pointer-events-none">
      {/* Sleek Glassmorphism Insights Card */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-80 rounded-2xl border border-white/10 bg-[#0d0d12]/95 p-4 text-xs text-ink-200 shadow-2xl shadow-black/80 backdrop-blur-xl animate-fade-scale">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-orange-400">
              <Flame size={13} className="text-orange-400" />
              <span className="tracking-tight">Spooky Season Insights</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ink-400 hover:text-white transition-colors"
              aria-label="Close insight"
            >
              <X size={13} />
            </button>
          </div>
          <p className="text-[11px] text-ink-300 leading-relaxed">
            {SEASONAL_INSIGHTS[tipIndex]}
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-ink-400 pt-2 border-t border-white/5">
            <span className="text-orange-400/80 font-mono">Tukonnect Intelligence</span>
            <button
              onClick={() => setTipIndex((prev) => (prev + 1) % SEASONAL_INSIGHTS.length)}
              className="text-orange-400 hover:underline cursor-pointer"
            >
              Next insight →
            </button>
          </div>
        </div>
      )}

      {/* Minimal Floating Seasonal Trigger */}
      <button
        onClick={handleTrigger}
        title="Spooky Season Assistant"
        className="pointer-events-auto group relative flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#0d0d12]/90 hover:bg-orange-500/10 px-3.5 py-2 text-xs font-semibold text-orange-400 shadow-xl shadow-black/50 backdrop-blur-md transition-all duration-200 hover:border-orange-500/60 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
        <span className="font-mono text-[11px] tracking-tight text-orange-300">
          🎃 Spooky Insights
        </span>
        <Sparkles size={11} className="text-orange-400 opacity-80" />
      </button>
    </div>
  );
}
