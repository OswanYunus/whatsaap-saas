import { useState } from "react";
import { playEerieChime, playGhostWhisper } from "./SpookyAudio";
import { X, Sparkles } from "lucide-react";

const SPOOKY_TIPS = [
  "🎃 Boo! Don't get ghosted by customers — use interactive campaign templates!",
  "👻 Pro tip: Warm up your WhatsApp lines so Meta doesn't haunt your account.",
  "🦇 Midnight campaigns get 24% higher open rates during Spooky Season!",
  "🍬 Sweet treat: Tag your contacts into groups for laser-targeted broadcasts.",
  "⚡ Witching hour: Connect extra devices on the Pro plan to multiply your sends!",
  "🕷️ Spooky fact: 98% of WhatsApp messages are opened within 3 minutes.",
];

export default function SpookyGhostPet() {
  const [minimized, setMinimized] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [isWobbling, setIsWobbling] = useState(false);
  const [showSpeech, setShowSpeech] = useState(true);

  const handleClick = (e: React.MouseEvent) => {
    setIsWobbling(true);
    playGhostWhisper();
    playEerieChime();

    // Spawn bats from ghost position
    const rect = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("spooky-bat-burst", {
        detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      })
    );

    setTipIndex((prev) => (prev + 1) % SPOOKY_TIPS.length);
    setShowSpeech(true);
    setTimeout(() => setIsWobbling(false), 800);
  };

  if (minimized) {
    return (
      <button
        onClick={() => {
          setMinimized(false);
          playEerieChime();
        }}
        title="Summon Spooky Helper 🎃"
        className="group fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-orange-500/40 bg-slate-950/85 text-xl shadow-lg shadow-orange-500/20 backdrop-blur-md transition-all hover:scale-110 hover:border-orange-400 hover:shadow-orange-500/40"
      >
        <span className="animate-bounce">🎃</span>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-black animate-pulse">
          ✨
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-none select-none">
      {/* Speech Bubble */}
      {showSpeech && (
        <div className="pointer-events-auto mb-3 max-w-[270px] rounded-2xl border border-purple-500/30 bg-slate-950/90 p-3.5 text-xs text-slate-100 shadow-xl shadow-purple-950/50 backdrop-blur-md animate-fade-scale">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-orange-400">
              <Sparkles size={12} className="text-orange-400 animate-spin" />
              <span>Spooky Helper</span>
            </div>
            <button
              onClick={() => setShowSpeech(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Close message"
            >
              <X size={12} />
            </button>
          </div>
          <p className="mt-1.5 text-slate-200 leading-relaxed">{SPOOKY_TIPS[tipIndex]}</p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="text-orange-300/80">Click ghost for more tips!</span>
            <button
              onClick={() => setMinimized(true)}
              className="hover:text-orange-300 underline underline-offset-2"
            >
              Minimize
            </button>
          </div>
        </div>
      )}

      {/* Floating Ghost Button */}
      <button
        onClick={handleClick}
        title="Click me for spooky magic!"
        className={`pointer-events-auto group relative flex h-14 w-14 items-center justify-center rounded-full border border-purple-400/40 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 shadow-2xl shadow-purple-500/30 backdrop-blur-lg transition-all duration-300 hover:scale-110 hover:border-orange-400 hover:shadow-orange-500/40 active:scale-95 ${
          isWobbling ? "animate-wiggle" : "animate-float"
        }`}
      >
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-500/20 blur-md group-hover:from-orange-500/40 group-hover:to-purple-500/40" />

        {/* Ghost / Pumpkin Avatar */}
        <span className="relative text-2xl drop-shadow-[0_0_8px_rgba(255,165,0,0.8)] transition-transform group-hover:rotate-12">
          👻
        </span>

        {/* Floating Mini Pumpkin Badge */}
        <span className="absolute -top-1.5 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-orange-400/60 bg-orange-600 text-[11px] shadow-sm animate-pulse">
          🎃
        </span>
      </button>
    </div>
  );
}
