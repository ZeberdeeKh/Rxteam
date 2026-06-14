# RX Team — ASG Bot + Site

Telegram-бот + сайт для airsoft-спільноти RX Team (Wrocław).
Повне ТЗ — у [PLAN.md](PLAN.md). Стек: Next.js + grammY + Supabase, деплой на Vercel.

## Етап 1 (готово в коді): анти-бот шилд
Заявка на вступ → бот шле капчу в особисті (PL/EN/UA) → правильно = approve + онбординг-FAQ;
невірно/таймаут = decline. Перемикачі функцій — у таблиці `settings`.

## Запуск (порядок дій)

1. **База:** Supabase → SQL Editor → виконати `supabase/schema.sql`.
2. **Залежності:** `npm install`.
3. **Env:** скопіювати `.env.example`, заповнити (ті ж значення додати у Vercel → Settings → Environment Variables):
   - `BOT_TOKEN` — від @BotFather
   - `WEBHOOK_SECRET`, `CRON_SECRET` — будь-які випадкові рядки
   - `SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `SUPABASE_SECRET_KEY` = `sb_secret_...`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — для сайту (можна пізніше)
4. **Деплой:** імпортувати репо у Vercel → Deploy.
5. **Webhook:** `BASE_URL=https://<app>.vercel.app BOT_TOKEN=... WEBHOOK_SECRET=... npm run set-webhook`
6. **Telegram:** додати бота в групу адміном з правом **приймати заявки**; увімкнути «Підтвердження нових учасників».

## Перемикачі функцій
У таблиці `settings`: `feature_shield`, `feature_onboarding_faq` (`true`/`false`).

## ⚠️ Безпека
`.env` у `.gitignore` — секрети в git не потрапляють. Токен бота і `sb_secret` ключ, що
світилися під час налаштування, варто **перевипустити** перед бойовим запуском
(BotFather → Revoke; Supabase → Rotate secret key).
