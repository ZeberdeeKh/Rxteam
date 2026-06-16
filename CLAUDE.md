# RX Team — інструкції проєкту

Сайт + Telegram-бот спільноти ASG/Airsoft (Wrocław).
Стек: **Next.js 14 (App Router) + Tailwind + Supabase + grammy**. UI польською/українською/англ.
(i18n у [lib/site-i18n.ts](lib/site-i18n.ts), тексти бота — [lib/strings.ts](lib/strings.ts)).

## Воркфлоу
- Прод-розробка: коміт у `main` = **деплой на Vercel**. Комітимо/пушимо лише на прохання.
- Доступ до БД — лише через `@/lib/*` (supabase-server/site-data/admin-data), не з компонентів.

## Дизайн — ОБОВ'ЯЗКОВО за стандартом
Будь-яка зміна UI (кнопки, заголовки, бейджі/шилдики, кольори, шрифти, відступи) робиться
**суворо за єдиним документом:** **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)**.

Коротко (деталі — у документі):
- **Кнопки** — рівно 2 типи: `btn("action")` / `btn("delete")` ([buttons.ts](components/ui/buttons.ts)). Жодних інших.
- **Бейджі** — `badgeClass(...)`, приглушені кольори ([styles.ts](components/ui/styles.ts)). Без яскравих.
- **Заголовки** — рівні `ui.*` зі [styles.ts](components/ui/styles.ts), ВЕРХНІЙ РЕГІСТР, колір `--c-brand-text`.
- **Кольори** — лише CSS-змінні з [globals.css](app/globals.css). Темна тема — без `dark:`-варіантів.
- **Логотип** = той самий колір, що й заголовки (`--c-brand-text`).
- Не дублюй активний пункт меню великим заголовком сторінки.
- Стилі — лише через `@/components/ui`. Не хардкодити Tailwind-класи кнопок/плашок/заголовків.
