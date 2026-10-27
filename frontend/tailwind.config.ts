import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          sidebar: "#5E9E49",
          sidebarHover: "#528D3F",
          sidebarPill: "rgba(255, 255, 255, 0.28)",
          primary: "#10B981",
          primaryDark: "#047857",
          cta: "#236B32",
          ctaHover: "#1C5628",
        },
        banner: {
          bg: "#EDF8EE",
          border: "#C6E7C9",
          tag: "#276A32",
          title: "#1A5323",
        },
        avri: {
          card: "#236B32",
          aman: "#16A34A",
          waspada: "#CA8A04",
          kritis: "#EA580C",
          bahaya: "#DC2626",
        },
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          600: "#475569",
          800: "#1E293B",
          900: "#0F172A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#FAFAF9",
          muted: "#F3F4F6",
          border: "#E5E7EB",
        },
        risk: {
          safe: "#16A34A",
          safeBg: "rgba(22, 163, 74, 0.10)",
          safeText: "#15803D",
          warning: "#D97706",
          warningBg: "rgba(217, 119, 6, 0.10)",
          warningText: "#B45309",
          danger: "#DC2626",
          dangerBg: "rgba(220, 38, 38, 0.10)",
          dangerText: "#B91C1C",
        },
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }],
        hero: ["2.5rem", { lineHeight: "1.1", fontWeight: "700" }],
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "var(--font-jakarta)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
