import { useEffect, useRef } from "react";
import { playBatFlutter } from "./SpookyAudio";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  type: "ember" | "wisp" | "ghost" | "bat";
  color: string;
  angle: number;
  spin: number;
  life?: number;
  maxLife?: number;
}

export default function SpookyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Particle[] = [];
    const MAX_PARTICLES = 28;

    const colors = [
      "rgba(255, 120, 40, ",   // Pumpkin orange
      "rgba(168, 85, 247, ",   // Mystic purple
      "rgba(34, 197, 94, ",    // Ectoplasm green
      "rgba(244, 63, 94, ",    // Blood rose
    ];

    function createParticle(type?: "ember" | "wisp" | "ghost" | "bat", x?: number, y?: number): Particle {
      const selectedType = type || (Math.random() > 0.65 ? (Math.random() > 0.5 ? "bat" : "ghost") : Math.random() > 0.5 ? "ember" : "wisp");
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: x ?? Math.random() * width,
        y: y ?? Math.random() * height,
        vx: (Math.random() - 0.5) * (selectedType === "bat" ? 2.5 : 0.8),
        vy: selectedType === "ember" ? -(0.5 + Math.random() * 0.8) : (Math.random() - 0.5) * 0.7,
        size: selectedType === "ghost" ? 14 + Math.random() * 10 : selectedType === "bat" ? 10 + Math.random() * 8 : 2 + Math.random() * 4,
        alpha: 0.15 + Math.random() * 0.45,
        type: selectedType,
        color: baseColor,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.03,
      };
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push(createParticle());
    }

    // Interactive mouse position
    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Global event for Bat Burst (e.g., clicking the pumpkin header or pet)
    const handleBatBurst = (e: Event) => {
      const custom = e as CustomEvent<{ x?: number; y?: number }>;
      const startX = custom.detail?.x ?? width / 2;
      const startY = custom.detail?.y ?? height / 2;
      playBatFlutter();

      for (let i = 0; i < 14; i++) {
        const p = createParticle("bat", startX, startY);
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 5;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 1.5;
        p.life = 0;
        p.maxLife = 120 + Math.random() * 60;
        particles.push(p);
      }
    };

    window.addEventListener("spooky-bat-burst", handleBatBurst);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Draw helpers
    function drawBat(p: Particle) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = `rgba(30, 20, 45, ${p.alpha * 0.9})`;
      ctx.shadowColor = p.color + "0.6)";
      ctx.shadowBlur = 8;

      const s = p.size;
      ctx.beginPath();
      // Bat wing curves
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 0.7, -s * 0.8, s, -s * 0.2);
      ctx.quadraticCurveTo(s * 0.6, s * 0.3, 0, s * 0.4);
      ctx.quadraticCurveTo(-s * 0.6, s * 0.3, -s, -s * 0.2);
      ctx.quadraticCurveTo(-s * 0.7, -s * 0.8, 0, 0);
      ctx.fill();

      // Tiny bat ears
      ctx.beginPath();
      ctx.moveTo(-2, -s * 0.15);
      ctx.lineTo(0, -s * 0.45);
      ctx.lineTo(2, -s * 0.15);
      ctx.fill();

      ctx.restore();
    }

    function drawGhost(p: Particle) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = `rgba(240, 245, 255, ${p.alpha * 0.65})`;
      ctx.shadowColor = "rgba(168, 85, 247, 0.4)";
      ctx.shadowBlur = 12;

      const s = p.size;
      // Ghost rounded head and wavy skirt
      ctx.beginPath();
      ctx.arc(0, -s * 0.3, s * 0.45, Math.PI, 0, false);
      ctx.lineTo(s * 0.45, s * 0.5);
      ctx.quadraticCurveTo(s * 0.2, s * 0.3, 0, s * 0.5);
      ctx.quadraticCurveTo(-s * 0.2, s * 0.3, -s * 0.45, s * 0.5);
      ctx.closePath();
      ctx.fill();

      // Spooky black eyes
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.arc(-s * 0.15, -s * 0.3, s * 0.08, 0, Math.PI * 2);
      ctx.arc(s * 0.15, -s * 0.3, s * 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawEmber(p: Particle) {
      if (!ctx) return;
      ctx.save();
      ctx.fillStyle = p.color + `${p.alpha})`;
      ctx.shadowColor = p.color + "0.8)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let lastTime = performance.now();

    function render(currentTime: number) {
      if (!isVisible) return;
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx!.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Gentle cursor push/interaction
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (1 - dist / 120) * 1.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;
        p.angle += p.spin;

        // Apply friction
        p.vx *= 0.985;
        if (p.type === "ember") {
          p.vy = p.vy * 0.98 - 0.02;
        } else {
          p.vy *= 0.985;
        }

        // Temporary burst particles life check
        if (p.life !== undefined && p.maxLife !== undefined) {
          p.life++;
          p.alpha = Math.max(0, 0.7 * (1 - p.life / p.maxLife));
          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
            continue;
          }
        }

        // Screen wrap
        if (p.x < -30) p.x = width + 20;
        if (p.x > width + 30) p.x = -20;
        if (p.y < -30) p.y = height + 20;
        if (p.y > height + 30) p.y = -20;

        // Render based on type
        if (p.type === "bat") {
          drawBat(p);
        } else if (p.type === "ghost") {
          drawGhost(p);
        } else {
          drawEmber(p);
        }
      }

      // Maintain baseline particle count
      while (particles.length < MAX_PARTICLES) {
        particles.push(createParticle());
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("spooky-bat-burst", handleBatBurst);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-80 transition-opacity duration-500"
    />
  );
}
