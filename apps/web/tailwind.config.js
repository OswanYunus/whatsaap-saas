/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif"
        ],
        mono: ["'Geist Mono'", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }]
      },
      colors: {
        ink: {
          50:  "#F7F7F8",
          100: "#EFEFEF",
          200: "#DCDCDE",
          300: "#B8B8BC",
          400: "#8A8A90",
          500: "#606067",
          600: "#46464D",
          700: "#2E2E34",
          800: "#1A1A1F",
          900: "#0D0D10"
        },
        accent: {
          50:  "#EDFBF3",
          100: "#D3F5E3",
          200: "#A8EBC7",
          300: "#72D9A5",
          400: "#3EC87E",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D"
        },
        canvas: {
          DEFAULT: "#EEEEF0"
        },
        "canvas-dark": "#080809",
        surface: {
          DEFAULT: "#FFFFFF"
        },
        "surface-dark": "#111113",
        "surface-raised": "#FAFAFA",
        "surface-raised-dark": "#18181B"
      },
      boxShadow: {
        card:         "0 1px 3px rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04)",
        "card-dark":  "0 1px 3px rgb(0 0 0 / 0.4),  0 0 0 1px rgb(255 255 255 / 0.06)",
        elevated:     "0 4px 24px -4px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.04)",
        "elevated-dark": "0 4px 24px -4px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.08)",
        glow:         "0 0 0 3px rgb(34 197 94 / 0.18)",
        "glow-sm":    "0 0 0 2px rgb(34 197 94 / 0.12)",
        dropdown:     "0 8px 32px -4px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.05)",
        "dropdown-dark": "0 8px 32px -4px rgb(0 0 0 / 0.5), 0 0 0 1px rgb(255 255 255 / 0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      animation: {
        "fade-in":        "fadeIn 0.2s ease-out",
        "fade-scale":     "fadeScale 0.18s ease-out",
        "slide-up":       "slideUp 0.22s ease-out",
        "slide-down":     "slideDown 0.18s ease-out",
        "slide-in-left":  "slideInLeft 0.25s ease-out",
        shimmer:          "shimmer 2s ease-in-out infinite",
        "count-up":       "countUp 0.6s ease-out",
        "pulse-glow":     "pulseGlow 2s ease-in-out infinite",
        float:            "spookyFloat 3.5s ease-in-out infinite",
        wiggle:           "spookyWiggle 0.6s ease-in-out infinite",
        "bat-flight-1":   "batFlight1 18s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "bat-flight-2":   "batFlight2 24s cubic-bezier(0.4, 0, 0.2, 1) 4s infinite",
        "bat-flight-3":   "batFlight3 20s cubic-bezier(0.4, 0, 0.2, 1) 9s infinite",
        "spider-sway":    "spiderSway 4s ease-in-out infinite"
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" }
        },
        fadeScale: {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideInLeft: {
          "0%":   { opacity: "0", transform: "translateX(-100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        shimmer: {
          "0%, 100%": { opacity: "0.5" },
          "50%":      { opacity: "1" }
        },
        countUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(34 197 94 / 0)" },
          "50%":      { boxShadow: "0 0 0 6px rgb(34 197 94 / 0.12)" }
        },
        spookyFloat: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%":      { transform: "translateY(-8px) rotate(3deg)" }
        },
        spookyWiggle: {
          "0%, 100%": { transform: "rotate(-6deg) scale(1.05)" },
          "50%":      { transform: "rotate(6deg) scale(1.05)" }
        },
        pumpkinGlow: {
          "0%, 100%": { boxShadow: "0 0 15px -3px rgba(249, 115, 22, 0.4)" },
          "50%":      { boxShadow: "0 0 25px 2px rgba(168, 85, 247, 0.6)" }
        },
        batFlight1: {
          "0%":   { transform: "translate3d(-100px, 0, 0) scale(0.8) rotate(5deg)" },
          "30%":  { transform: "translate3d(35vw, 60px, 0) scale(1.1) rotate(-8deg)" },
          "60%":  { transform: "translate3d(70vw, -30px, 0) scale(0.9) rotate(10deg)" },
          "100%": { transform: "translate3d(115vw, 40px, 0) scale(1) rotate(-5deg)" }
        },
        batFlight2: {
          "0%":   { transform: "translate3d(-80px, 20px, 0) scale(0.7) rotate(-5deg)" },
          "40%":  { transform: "translate3d(45vw, -40px, 0) scale(0.9) rotate(12deg)" },
          "70%":  { transform: "translate3d(75vw, 50px, 0) scale(1) rotate(-10deg)" },
          "100%": { transform: "translate3d(115vw, -20px, 0) scale(0.8) rotate(4deg)" }
        },
        batFlight3: {
          "0%":   { transform: "translate3d(-120px, -20px, 0) scale(0.6) rotate(8deg)" },
          "50%":  { transform: "translate3d(50vw, 30px, 0) scale(0.75) rotate(-6deg)" },
          "100%": { transform: "translate3d(115vw, -50px, 0) scale(0.6) rotate(6deg)" }
        },
        spiderSway: {
          "0%, 100%": { transform: "rotate(-8deg)" },
          "50%":      { transform: "rotate(8deg)" }
        }
      }
    }
  },
  plugins: []
};
