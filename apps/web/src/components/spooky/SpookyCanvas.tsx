import { useEffect, useRef } from "react";
import { playBatFlutter } from "./SpookyAudio";

interface Bat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  wingPhase: number;
  wingSpeed: number;
  alpha: number;
  life?: number;
  maxLife?: number;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  pulsePhase: number;
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

    const bats: Bat[] = [];
    const embers: Ember[] = [];

    const MAX_BATS = 8;
    const MAX_EMBERS = 22;

    const emberColors = [
      "249, 115, 22", // Pumpkin orange
      "168, 85, 247", // Violet
      "234, 88, 12",  // Deep amber
      "59, 130, 246", // Spectral cyan
    ];

    function createBat(x?: number, y?: number): Bat {
      const startX = x ?? (Math.random() > 0.5 ? -30 : width + 30);
      const startY = y ?? (Math.random() * (height * 0.45));
      const targetDir = startX < width / 2 ? 1 : -1;

      return {
        x: startX,
        y: startY,
        vx: (1.2 + Math.random() * 1.8) * targetDir,
        vy: (Math.random() - 0.5) * 0.8,
        size: 7 + Math.random() * 6,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.15 + Math.random() * 0.1,
        alpha: 0.25 + Math.random() * 0.45,
      };
    }

    function createEmber(): Ember {
      const color = emberColors[Math.floor(Math.random() * emberColors.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.3 + Math.random() * 0.6),
        radius: 1 + Math.random() * 2.2,
        alpha: 0.1 + Math.random() * 0.4,
        color,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    }

    for (let i = 0; i < MAX_BATS; i++) bats.push(createBat());
    for (let i = 0; i < MAX_EMBERS; i++) embers.push(createEmber());

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleBatBurst = (e: Event) => {
      const custom = e as CustomEvent<{ x?: number; y?: number }>;
      const startX = custom.detail?.x ?? width / 2;
      const startY = custom.detail?.y ?? height / 2;
      playBatFlutter();

      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 4;
        bats.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          size: 6 + Math.random() * 5,
          wingPhase: Math.random() * Math.PI * 2,
          wingSpeed: 0.2 + Math.random() * 0.15,
          alpha: 0.7,
          life: 0,
          maxLife: 90 + Math.random() * 50,
        });
      }
    };

    window.addEventListener("spooky-bat-burst", handleBatBurst);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Realistic elegant bat silhouette drawing with flapping bezier wings
    function drawBat(b: Bat) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(b.x, b.y);

      // Facing direction
      const dir = b.vx >= 0 ? 1 : -1;
      ctx.scale(dir, 1);

      const wingY = Math.sin(b.wingPhase) * (b.size * 0.8);
      const s = b.size;

      ctx.fillStyle = `rgba(18, 14, 28, ${b.alpha})`;
      ctx.shadowColor = `rgba(249, 115, 22, ${b.alpha * 0.5})`;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      // Body
      ctx.ellipse(0, 0, s * 0.3, s * 0.6, 0, 0, Math.PI * 2);

      // Left wing
      ctx.moveTo(-s * 0.2, 0);
      ctx.quadraticCurveTo(-s * 1.1, wingY - s * 0.4, -s * 2.2, wingY);
      ctx.quadraticCurveTo(-s * 1.4, wingY + s * 0.8, -s * 0.2, s * 0.4);

      // Right wing
      ctx.moveTo(s * 0.2, 0);
      ctx.quadraticCurveTo(s * 1.1, wingY - s * 0.4, s * 2.2, wingY);
      ctx.quadraticCurveTo(s * 1.4, wingY + s * 0.8, s * 0.2, s * 0.4);

      ctx.fill();

      // Small subtle glowing eyes
      ctx.fillStyle = `rgba(255, 120, 40, ${b.alpha * 0.9})`;
      ctx.fillRect(s * 0.08, -s * 0.35, 1.5, 1.5);

      ctx.restore();
    }

    function drawEmber(e: Ember) {
      if (!ctx) return;
      ctx.save();
      const currentAlpha = e.alpha * (0.7 + 0.3 * Math.sin(e.pulsePhase));
      ctx.fillStyle = `rgba(${e.color}, ${currentAlpha})`;
      ctx.shadowColor = `rgba(${e.color}, 0.8)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
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

      // Render Embers
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.x += e.vx * 60 * dt;
        e.y += e.vy * 60 * dt;
        e.pulsePhase += 0.04;

        if (e.y < -10) {
          e.y = height + 10;
          e.x = Math.random() * width;
        }
        if (e.x < -10) e.x = width + 10;
        if (e.x > width + 10) e.x = -10;

        drawEmber(e);
      }

      // Render Bats
      for (let i = bats.length - 1; i >= 0; i--) {
        const b = bats[i];

        // Cursor avoidance
        const dx = b.x - mouseX;
        const dy = b.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const force = (1 - dist / 140) * 2.0;
          b.vx += (dx / dist) * force;
          b.vy += (dy / dist) * force;
        }

        b.x += b.vx * 60 * dt;
        b.y += b.vy * 60 * dt + Math.sin(b.wingPhase * 0.5) * 0.4;
        b.wingPhase += b.wingSpeed;

        if (b.life !== undefined && b.maxLife !== undefined) {
          b.life++;
          b.alpha = Math.max(0, 0.75 * (1 - b.life / b.maxLife));
          if (b.life >= b.maxLife) {
            bats.splice(i, 1);
            continue;
          }
        }

        // Screen wrap
        if (b.x < -60) b.x = width + 50;
        if (b.x > width + 60) b.x = -50;
        if (b.y < -50) b.y = height * 0.5;
        if (b.y > height + 50) b.y = -30;

        drawBat(b);
      }

      while (bats.length < MAX_BATS) {
        bats.push(createBat());
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
      className="pointer-events-none fixed inset-0 z-0 opacity-75"
    />
  );
}
