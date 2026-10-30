/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080B10",
          card: "#0E1420",
          surface: "#121A2A",
          border: "#1C2738",
          borderLight: "#2A3B54",
          neon: "#00FF9D",
          neonGlow: "rgba(0, 255, 157, 0.2)",
          blue: "#00E5FF",
          blueGlow: "rgba(0, 229, 255, 0.2)",
          amber: "#FFB800",
          red: "#FF3366",
          redGlow: "rgba(255, 51, 102, 0.25)",
          text: "#E2E8F0",
          muted: "#8899A6",
          subtle: "#4B5563"
        }
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ],
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ]
      },
      boxShadow: {
        neon: "0 0 15px -2px rgba(0, 255, 157, 0.35)",
        blue: "0 0 15px -2px rgba(0, 229, 255, 0.35)",
        red: "0 0 15px -2px rgba(255, 51, 102, 0.45)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 255, 157, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 255, 157, 0.6)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        }
      }
    },
  },
  plugins: [],
};
