import { useState, useEffect } from "react";
import { Volume2, VolumeX, Flame } from "lucide-react";
import {
  isSpookySoundEnabled,
  setSpookySoundEnabled,
  playEerieChime,
} from "./SpookyAudio";

export default function SpookyHeaderWidget() {
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    setSoundOn(isSpookySoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSpookySoundEnabled(next);
    if (next) {
      playEerieChime();
    }
  };

  const triggerBatBurst = (e: React.MouseEvent<HTMLButtonElement>) => {
    playEerieChime();
    const rect = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("spooky-bat-burst", {
        detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      })
    );
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Bat Swarm / Spooky Season Burst Button */}
      <button
        onClick={triggerBatBurst}
        title="Spooky Season is here! Click for bat burst 🦇"
        className="group relative flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-2.5 py-1.5 text-xs font-semibold text-orange-400 transition-all duration-200 hover:border-orange-500/60 hover:bg-orange-500/20 hover:text-orange-300 hover:shadow-md hover:shadow-orange-500/20 active:scale-95 dark:border-orange-400/25 dark:bg-orange-400/10"
      >
        <Flame size={13} className="text-orange-400 animate-pulse" />
        <span className="hidden md:inline font-mono tracking-tight text-[11px]">
          SPOOKY MODE
        </span>
        <span className="text-sm transition-transform group-hover:rotate-12 group-hover:scale-125">
          🎃
        </span>
      </button>

      {/* Spooky Sound Effects Toggle */}
      <button
        onClick={toggleSound}
        title={soundOn ? "Mute spooky audio" : "Enable eerie sound effects"}
        aria-label="Toggle spooky sounds"
        className={`btn-ghost h-9 w-9 p-0 rounded-xl transition-colors ${
          soundOn
            ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
            : "text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
        }`}
      >
        {soundOn ? (
          <Volume2 size={16} className="animate-pulse" />
        ) : (
          <VolumeX size={16} />
        )}
      </button>
    </div>
  );
}
