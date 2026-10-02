import { useState, useEffect } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
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
    <div className="flex items-center gap-2">
      {/* Sleek Gothic Season Badge & Trigger */}
      <button
        onClick={triggerBatBurst}
        title="Spooky Season Edition • Click for ambient bat flight"
        className="group relative flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] hover:bg-orange-500/[0.12] hover:border-orange-500/40 px-3 py-1.5 text-xs font-semibold text-orange-400 transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
        <span className="hidden sm:inline font-mono tracking-wider text-[11px] uppercase text-orange-300">
          Spooky Season
        </span>
        <Sparkles size={12} className="text-orange-400 opacity-70 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Ambient Sound Toggle */}
      <button
        onClick={toggleSound}
        title={soundOn ? "Mute ambient audio" : "Enable atmospheric sound effects"}
        aria-label="Toggle ambient sounds"
        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
          soundOn
            ? "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
            : "border-white/10 bg-white/[0.03] text-ink-400 hover:text-ink-200 hover:bg-white/[0.06]"
        }`}
      >
        {soundOn ? <Volume2 size={15} className="text-orange-400" /> : <VolumeX size={15} />}
      </button>
    </div>
  );
}
