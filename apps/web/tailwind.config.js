/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Geist",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif"
        ],
        mono: ["Geist Mono", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }]
      },
      colors: {
        ink: {
          50: "#F4F4F5",
          100: "#E4E4E7",
          200: "#D4D4D8",
          300: "#A1A1AA",
          400: "#71717A",
          500: "#52525B",
          600: "#3F3F46",
          700: "#27272A",
          800: "#18181B",
          900: "#09090B"
        },
        accent: {
          50: "#ECFDF3",
          100: "#D1FAE5",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D"
        },
        canvas: {
          DEFAULT: "#F8F9FB"
        },
        "canvas-dark": "#0C0C0E",
        surface: {
          DEFAULT: "#FFFFFF"
        },
        "surface-dark": "#141416",
        "surface-raised": "#FAFAFA",
        "surface-raised-dark": "#1A1A1D"
      },
      boxShadow: {
        card: "0 0 0 1px rgb(0 0 0 / 0.04)",
        "card-dark": "0 0 0 1px rgb(255 255 255 / 0.06)",
        dropdown: "0 4px 16px -2px rgb(0 0 0 / 0.08), 0 0 0 1px rgb(0 0 0 / 0.04)",
        "dropdown-dark": "0 4px 16px -2px rgb(0 0 0 / 0.4), 0 0 0 1px rgb(255 255 255 / 0.06)"
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-down": "slideDown 0.15s ease-out",
        shimmer: "shimmer 1.8s ease-in-out infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" }
        }
      }
    }
  },
  plugins: []
};
