import type { Config } from "tailwindcss";

// Нейтральний стиль 6.0 — фінальний дизайн прийде на Етапі 7 (Google AI Studio).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Стримана мілітарі-нейтраль (легко перекрити пізніше).
        brand: {
          DEFAULT: "#3f6212", // olive-700
          dark: "#1a2e05",
          light: "#84cc16",
        },
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
