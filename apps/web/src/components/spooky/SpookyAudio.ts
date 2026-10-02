/**
 * Procedural Web Audio API sound generator for Spooky Season.
 * Requires zero external audio files / assets (0 KB download!).
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSpookySoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("spooky-sound-enabled") === "true";
}

export function setSpookySoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("spooky-sound-enabled", enabled ? "true" : "false");
  }
}

// Initialize from storage
if (typeof window !== "undefined") {
  soundEnabled = isSpookySoundEnabled();
}

/**
 * Ethereal spooky chord chime
 */
export function playEerieChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const frequencies = [220, 277.18, 329.63, 415.3]; // A minor / spooky augmented chord

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 1.2 + idx * 0.1);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04 / (idx + 1), now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5 + idx * 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + 2.0);
  });
}

/**
 * Bat wings flutter sound
 */
export function playBatFlutter() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(140 + Math.random() * 80, now + i * 0.08);
    osc.frequency.exponentialRampToValueAtTime(60, now + i * 0.08 + 0.06);

    gain.gain.setValueAtTime(0.03, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.08);
  }
}

/**
 * Ghost spectral whisper
 */
export function playGhostWhisper() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.exponentialRampToValueAtTime(560, now + 0.4);
  osc.frequency.exponentialRampToValueAtTime(290, now + 0.9);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.03, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.1);
}
