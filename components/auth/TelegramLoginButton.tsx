"use client";

import { useEffect, useState } from "react";
import { btn } from "@/components/ui";

// Дані, які Telegram повертає після авторизації (підписані полем hash).
type TgUser = Record<string, string | number>;

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth: (
          options: { bot_id: string; request_access?: string; lang?: string },
          callback: (user: TgUser | false) => void,
        ) => void;
      };
    };
  }
}

const SCRIPT_ID = "telegram-widget-js";
const SCRIPT_SRC = "https://telegram.org/js/telegram-widget.js?22";

// Власна кнопка входу через Telegram у стилі форми (btn "primary").
// Кнопку малюємо ми, а авторизацію відкриває ОФІЦІЙНИЙ скрипт віджета через
// window.Telegram.Login.auth — той самий popup, що й офіційна синя кнопка.
// Результат приходить у callback (postMessage, БЕЗ hash-фрагмента), далі
// віддаємо його на /auth/telegram тими ж query-параметрами, які перевіряє
// verifyTelegramAuth. Домен бота має бути заданий у @BotFather (/setdomain).
export default function TelegramLoginButton({ botId, label }: { botId: string; label: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.Telegram?.Login) {
      setReady(true);
      return;
    }
    let s = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = SCRIPT_SRC;
      s.async = true;
      document.body.appendChild(s);
    }
    const onLoad = () => setReady(true);
    s.addEventListener("load", onLoad);
    return () => s?.removeEventListener("load", onLoad);
  }, []);

  function login() {
    window.Telegram?.Login?.auth({ bot_id: botId, request_access: "write" }, (user) => {
      if (!user) return; // користувач закрив вікно без авторизації
      // Передаємо рівно ті поля, що підписав Telegram (порядок не важливий —
      // сервер сортує сам), інакше hash не зійдеться.
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(user)) {
        if (v != null) params.set(k, String(v));
      }
      window.location.href = `/auth/telegram?${params.toString()}`;
    });
  }

  return (
    <button
      type="button"
      onClick={login}
      disabled={!ready}
      className={`${btn("action")} w-full`}
    >
      <TelegramIcon />
      {label}
    </button>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}
