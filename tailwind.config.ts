import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        vault: {
          950: "#050608",
          900: "#090A0F",
          850: "#0E1117",
          800: "#131722",
          700: "#1F2430",
          card: "rgba(14, 17, 23, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
          emerald: {
            DEFAULT: "#10B981",
            glow: "#059669",
            light: "#34D399",
            dark: "#064E3B",
          },
          cyan: {
            DEFAULT: "#06B6D4",
            glow: "#0891B2",
            light: "#22D3EE",
            dark: "#164E63",
          },
          amber: {
            DEFAULT: "#F59E0B",
            glow: "#D97706",
          },
          rose: {
            DEFAULT: "#F43F5E",
            glow: "#E11D48",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Courier New", "monospace"],
      },
      boxShadow: {
        "emerald-glow": "0 0 25px -5px rgba(16, 185, 129, 0.35)",
        "cyan-glow": "0 0 25px -5px rgba(6, 182, 212, 0.35)",
        "glass-inner": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s infinite linear",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%": { opacity: "0.4" },
          "100%": { opacity: "1" },
        },
      },
      backgroundImage: {
        "radial-dark": "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.08), transparent 70%)",
        "radial-cyan": "radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.06), transparent 50%)",
        "grid-pattern": "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
