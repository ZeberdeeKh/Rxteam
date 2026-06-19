// Спільна валідація вводу (сайт + бот), щоб правила не розходились між каналами.

export type CallsignResult = { ok: true; value: string } | { ok: false; reason: "empty" | "invalid" };

// Дозволені символи позивного: літери будь-якої мови, цифри, пробіл, _ . -
const CALLSIGN_ALLOWED = /^[\p{L}\p{N}_.\- ]{2,32}$/u;

// Контрол-символи (C0 0x00-0x1f, DEL 0x7f) і bidi-оверрайди/ізоляти (202A-202E, 2066-2069):
// числова перевірка по code point (без керівних символів у самому коді — надійніше за regex).
function hasBadChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f) return true; // C0 + DEL
    if (c >= 0x202a && c <= 0x202e) return true; // bidi overrides
    if (c >= 0x2066 && c <= 0x2069) return true; // bidi isolates
  }
  return false;
}

// Нормалізує/перевіряє позивний: NFC, схлоп пробілів, межі 2..32, заборона контрол/bidi
// символів, whitelist символів. Захищає від impersonation (homoglyph/RTL) і сміттєвого/
// наддовгого вводу. XSS неможливий (React екранує) — це про цілісність відображення.
// Однакові правила і на сайті, і в боті.
export function normalizeCallsign(raw: string): CallsignResult {
  const value = (raw ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  if (value.length < 2 || value.length > 32) return { ok: false, reason: "empty" };
  if (hasBadChars(value)) return { ok: false, reason: "invalid" };
  if (!CALLSIGN_ALLOWED.test(value)) return { ok: false, reason: "invalid" };
  return { ok: true, value };
}
