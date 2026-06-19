// Перевірка секрету для cron-ендпоінтів. FAIL-CLOSED: якщо CRON_SECRET не заданий —
// відмовляємо (503), інакше ендпоінт став би публічним і будь-хто міг би тригерити
// нагадування / неявки / прибирання. Якщо заданий — вимагаємо Bearer-збіг.
// Повертає null, коли запит авторизований; інакше готовий Response для return.
export function checkCronAuth(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Cron not configured", { status: 503 });
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  return null;
}
