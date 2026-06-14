"use client";

import { useEffect, useRef } from "react";

// Telegram Login Widget (redirect-режим). Домен бота має бути заданий у
// @BotFather (/setdomain → www.rxteam.pl), інакше віджет не авторизує.
export default function TelegramLoginButton({ bot }: { bot: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", bot);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-userpic", "false");
    s.setAttribute("data-radius", "8");
    s.setAttribute("data-auth-url", `${window.location.origin}/auth/telegram`);
    s.setAttribute("data-request-access", "write");
    el.appendChild(s);
  }, [bot]);

  return <div ref={ref} className="flex justify-center" />;
}
