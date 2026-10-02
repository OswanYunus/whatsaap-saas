import { type ReactNode } from "react";

export function CornerSpiderweb({ position = "left" }: { position?: "left" | "right" }) {
  const isLeft = position === "left";
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 ${
        isLeft ? "left-0" : "right-0 scale-x-[-1]"
      } z-20 w-48 h-48 sm:w-64 sm:h-64 opacity-60 transition-opacity duration-500`}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
      >
        {/* Main anchor threads */}
        <path d="M0 0 L200 0" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <path d="M0 0 L0 200" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <path d="M0 0 L180 180" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <path d="M0 0 L90 190" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" />
        <path d="M0 0 L190 90" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" />
        <path d="M0 0 L40 195" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />
        <path d="M0 0 L195 40" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />

        {/* Concentric spiral webs */}
        <path d="M25 0 Q25 25 0 25" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" fill="none" />
        <path d="M50 0 Q50 50 0 50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" fill="none" />
        <path d="M80 0 Q80 80 0 80" stroke="rgba(255,255,255,0.28)" strokeWidth="0.7" fill="none" />
        <path d="M115 0 Q115 115 0 115" stroke="rgba(255,255,255,0.25)" strokeWidth="0.65" fill="none" />
        <path d="M155 0 Q155 155 0 155" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" fill="none" />
        <path d="M195 0 Q195 195 0 195" stroke="rgba(255,255,255,0.18)" strokeWidth="0.55" fill="none" />

        {/* Spider dangling on silk */}
        {isLeft && (
          <g className="animate-spider-sway origin-top">
            <line x1="80" y1="80" x2="80" y2="135" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" strokeDasharray="2 1" />
            <ellipse cx="80" cy="138" rx="4" ry="5.5" fill="#0f0c18" stroke="rgba(249,115,22,0.6)" strokeWidth="0.8" />
            <circle cx="80" cy="134" r="2.5" fill="#0f0c18" stroke="rgba(249,115,22,0.6)" strokeWidth="0.8" />
            {/* Spider legs */}
            <path d="M76 136 Q70 133 67 138" stroke="rgba(249,115,22,0.7)" strokeWidth="0.7" fill="none" />
            <path d="M76 138 Q68 138 65 143" stroke="rgba(249,115,22,0.7)" strokeWidth="0.7" fill="none" />
            <path d="M84 136 Q90 133 93 138" stroke="rgba(249,115,22,0.7)" strokeWidth="0.7" fill="none" />
            <path d="M84 138 Q92 138 95 143" stroke="rgba(249,115,22,0.7)" strokeWidth="0.7" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function AnimatedBats() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {/* Bat 1 */}
      <div className="absolute top-[12%] left-[-80px] animate-bat-flight-1 opacity-70">
        <svg viewBox="0 0 50 30" width="36" height="22" fill="#0c0914" className="drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]">
          <path d="M25 15 Q35 0 48 5 Q38 18 28 17 Q25 22 25 15 Q22 22 19 17 Q9 18 2 5 Q15 0 25 15 Z" />
        </svg>
      </div>

      {/* Bat 2 */}
      <div className="absolute top-[22%] left-[-80px] animate-bat-flight-2 opacity-60">
        <svg viewBox="0 0 50 30" width="28" height="18" fill="#0c0914" className="drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]">
          <path d="M25 15 Q35 0 48 5 Q38 18 28 17 Q25 22 25 15 Q22 22 19 17 Q9 18 2 5 Q15 0 25 15 Z" />
        </svg>
      </div>

      {/* Bat 3 */}
      <div className="absolute top-[8%] left-[-80px] animate-bat-flight-3 opacity-50">
        <svg viewBox="0 0 50 30" width="20" height="14" fill="#0c0914" className="drop-shadow-[0_0_4px_rgba(249,115,22,0.3)]">
          <path d="M25 15 Q35 0 48 5 Q38 18 28 17 Q25 22 25 15 Q22 22 19 17 Q9 18 2 5 Q15 0 25 15 Z" />
        </svg>
      </div>
    </div>
  );
}

export function RollingMist() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed bottom-0 left-0 right-0 h-44 z-10 overflow-hidden">
      {/* Mist layer 1 */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06040a] via-[#06040a]/70 to-transparent" />
      <div className="absolute -bottom-10 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_70%)] blur-2xl animate-pulse" />
      <div className="absolute -bottom-6 left-0 right-0 h-28 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.12),transparent_65%)] blur-2xl animate-pulse" style={{ animationDelay: "1.5s" }} />
    </div>
  );
}

interface HalloweenAuthLayoutProps {
  children: ReactNode;
}

export default function HalloweenAuthLayout({ children }: HalloweenAuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-[#07050d] text-white">
      {/* 1. Base Theatrical Artwork Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90 scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/halloween/haunted_mansion_bg.jpg')",
        }}
      />

      {/* 2. Atmospheric Midnight Vignette Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(6,4,11,0.75)_65%,rgba(5,3,9,0.95)_100%)]"
      />

      {/* 3. Deep Top & Bottom Shadow Gradient for Text Contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-black/60 via-transparent to-black/85"
      />

      {/* 4. Intricate Corner Spiderwebs */}
      <CornerSpiderweb position="left" />
      <CornerSpiderweb position="right" />

      {/* 5. Smooth Hardware-Accelerated Bats */}
      <AnimatedBats />

      {/* 6. Rolling Mist at Ground */}
      <RollingMist />

      {/* 7. Foreground Content Card Layer */}
      <div className="relative z-20 w-full px-4 py-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
