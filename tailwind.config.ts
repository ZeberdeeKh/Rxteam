import type { Config } from "tailwindcss";

// Дизайн перенесено з «Kalkulator» (Етап 7): бренд indigo/violet + шрифт Inter + темна тема.
// Темна тема працює БЕЗ dark:-варіантів на кожному елементі: палітри `gray` та `white`
// прив'язані до CSS-змінних, які перевизначаються в globals.css під html.dark.
// `neutral` НЕ перемикається — це фіксована світла палітра для тексту на кольорових кнопках
// (text-neutral-50) та плаваючої кнопки bug-report (dark:-варіанти).
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Бренд — хакі (мілітарі-оливковий), пасує тематиці ASG/Airsoft. DEFAULT/dark/light —
        // аліаси, щоб наявні класи bg-brand / text-brand-dark / hover:bg-brand-dark працювали без правок.
        brand: {
          DEFAULT: "#6b6a3c", // brand-600
          dark: "#545331",    // brand-700
          light: "#9d9b66",   // brand-400
          50: "#f6f6f1",
          100: "#e9e9da",
          200: "#d3d3b6",
          300: "#b8b78d",
          400: "#9d9b66",
          500: "#83814b",
          600: "#6b6a3c",
          700: "#545331",
          800: "#45442b",
          900: "#3b3a27",
          950: "#1f1f13",
        },
        // Поверхні/текст сайту — перемикаються між світлою і темною темою через CSS-змінні.
        white: "var(--c-white)",
        gray: {
          50: "var(--c-gray-50)",
          100: "var(--c-gray-100)",
          200: "var(--c-gray-200)",
          300: "var(--c-gray-300)",
          400: "var(--c-gray-400)",
          500: "var(--c-gray-500)",
          600: "var(--c-gray-600)",
          700: "var(--c-gray-700)",
          800: "var(--c-gray-800)",
          900: "var(--c-gray-900)",
          950: "var(--c-gray-950)",
        },
        // Фіксована світла палітра (НЕ перемикається) — для тексту на кольорових кнопках.
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
