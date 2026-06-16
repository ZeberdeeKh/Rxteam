import type { Config } from "tailwindcss";

// Дизайн перенесено на мілітарний стиль ab3.army (Етап AB3, 2026-06-16):
// помаранчевий PRIMARY (#f6921e), оливково-чорні фони, ПОВНІСТЮ КВАДРАТНІ елементи
// (borderRadius-шкала = 0, крім `full` для службових кружечків), плоский вигляд.
// Тема ЛИШЕ темна: палітри `gray`/`white` прив'язані до CSS-змінних (globals.css :root).
// `neutral` — фіксована світла палітра для тексту на кольорових кнопках (text-neutral-50).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PRIMARY — помаранчевий ab3. Головний акцент: CTA, заголовки, лого, активні стани.
        primary: {
          DEFAULT: "#f6921e",
          hover: "#f08407", // яскравіший ховер (як inline в ab3)
          deep: "#e16709",  // orange-600
          fg: "#000000",    // текст на заливці solid-кнопки
          500: "#f6921e",
          600: "#e16709",
        },
        // Акценти: беж/хакі (другорядний) + оливка для темних поверхонь.
        beige: "#d6b588",
        olive: { dark: "#111a0b", base: "#1a1a1a" },
        // АЛІАС `brand` → тепер дивиться на помаранч, щоб наявні класи
        // bg-brand / ring-brand / hover:border-brand / accent-brand не ламались до повної міграції.
        brand: {
          DEFAULT: "#f6921e",
          dark: "#e16709",
          light: "#f6921e",
          50: "#fff4e6",
          100: "#ffe2bf",
          200: "#ffcd8f",
          300: "#fbb45c",
          400: "#f6921e",
          500: "#f6921e",
          600: "#e16709",
          700: "#c0590a",
          800: "#974607",
          900: "#6f3405",
          950: "#3a1b02",
        },
        // Поверхні/текст сайту — темні значення з CSS-змінних (globals.css :root).
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
        // Фіксована світла палітра — для тексту/іконок на кольорових кнопках (text-neutral-50).
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
        // Тіло — Mulish (як в ab3). Заголовки/кнопки — Oswald (вільний мілітарний аналог;
        // офіційний UAF Sans НЕ беремо — це шрифт ЗСУ, а RX — страйкбол).
        sans: ["Mulish", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Oswald", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Квадратний вигляд ab3: уся шкала = 0px (будь-який залишковий rounded-* → 0).
        // `full` лишаємо для свідомо круглих службових елементів (FAB, кругла icon-кнопка).
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
