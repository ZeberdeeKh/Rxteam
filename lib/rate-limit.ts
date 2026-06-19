// Простий in-memory sliding-window лімітер (best-effort, per-instance). Дешевий бар'єр
// проти брутфорсу/спаму на одному serverless-інстансі; для durable обмеження через кілька
// інстансів потрібна таблиця/Redis (свідомий компроміс — див. SECURITY_FINDINGS.md).
const buckets = new Map<string, number[]>();

// Повертає true, якщо дію дозволено (і реєструє спробу); false — якщо ліміт вичерпано.
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
