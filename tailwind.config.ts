import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050807",
        panel: "#0c1210",
        neon: "#39ff14",
        "neon-dim": "#1a7a2a",
        danger: "#ff3860",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ["Orbitron", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 12px rgba(57, 255, 20, 0.35), 0 0 40px rgba(57, 255, 20, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
