# RX Team — Security Findings & Remediation

**Scope:** authorized defensive security audit of Project_RX (Next.js 14 App Router + Server
Actions, Supabase, grammy Telegram bot, Vercel). **Date:** 2026-06-19.
**Driving risk:** Postgres RLS is OFF (ADR-0018) → server-side application code is the only
authorization gate.

**Method:** full code read (grounded in `docs/DOCS_AUTH.md` + ADR-0016..0022) plus a read-only
multi-agent *find → adversarially-verify* pass (14 finder areas, every candidate finding
independently re-checked: 33 confirmed, 7 refuted). Two first-pass severities were corrected by
verification (host-header HIGH→LOW; "Next.js outdated CVE" → false, lockfile pins **next@14.2.35**,
already patched).

> **Posture after verification:** no always-live critical/high holes. The highest currently-live
> issues are MEDIUM (economy race, signIn brute-force, bug-report spam). The scariest item (forgeable
> session) only fires under env misconfiguration (notably Vercel preview deploys).

## Status legend
- **Fixed** — code change applied this session (typechecked).
- **Mitigated** — meaningfully reduced in code; full fix needs owner config or a DB migration (noted).
- **Owner-config** — closed only when the owner sets env / Supabase settings (see end).
- **Accepted** — inherent tradeoff; documented, no code change.

## Findings

| # | Sev | Title | Status | Fix location |
|---|-----|-------|--------|--------------|
| 1 | MED | Economy double-spend (non-atomic point deduction) | **Fixed** | `lib/economy.ts` `spendPoints`; `app/shop/actions.ts`; `lib/bot.ts` buyrank |
| 2 | MED | `signIn` no app-level throttle/captcha | **Mitigated** + Owner-config | `app/auth/actions.ts` (rate-limit error now surfaced); Supabase dashboard limits |
| 3 | MED | bug-report rate-limit bypass via spoofed XFF; unbounded description | **Fixed** | `app/api/bug-report/route.ts` |
| 4 | HIGH-if-misconfig | TG session secret falls back to public literal `"rx-dev-secret"` | **Fixed** (fail-closed) + Owner-config | `lib/tg-session.ts`; set `SESSION_SECRET` |
| 5 | MED(config) | Cron routes fail-open when `CRON_SECRET` unset | **Fixed** (fail-closed) | `lib/cron-auth.ts` + 3 cron routes |
| 6 | LOW | Bot webhook fail-open when `WEBHOOK_SECRET` unset | **Fixed** (fail-closed) | `app/api/bot/route.ts` |
| 7 | LOW | Link-code redemption has no attempt cap | **Mitigated** | `app/cabinet/actions.ts` + `lib/rate-limit.ts` (best-effort, per-instance) |
| 8 | LOW | Link-code redemption non-atomic (one-time-use race) | **Fixed** | `lib/identities.ts` (compare-and-swap) |
| 9 | LOW | Missing security headers; `X-Powered-By` exposed | **Fixed** (CSP deferred) | `next.config.mjs` |
| 10 | LOW | Gallery upload accepts SVG / trusts client MIME | **Fixed** | `app/api/admin/gallery/upload/route.ts` (magic-byte sniff) |
| 11 | LOW | Web check-in geofence trusts client lat/lng | **Accepted** | inherent to browser geolocation (see notes) |
| 12 | LOW | `webCheckin` didn't re-assert `game.status` | **Fixed** | `app/cabinet/actions.ts` |
| 13 | LOW | Registration capacity TOCTOU | **Mitigated** | `app/cabinet/actions.ts` (post-insert rollback; full fix needs DB fn) |
| 14 | LOW | Input bounds: free_seats / from_place / callsign (site+bot) | **Fixed** | `lib/validation.ts`, `lib/site-player.ts`, `app/cabinet/actions.ts`, `lib/bot.ts` |
| 15 | LOW | No DB `CHECK (points_balance >= 0)` backstop | **Owner-config** | optional `supabase/etap31.sql` |
| 16 | LOW | Master role keyed on mutable @username | **Fixed** (additive) + Owner-config | `lib/players.ts` (`master_tg_id` takes precedence) |
| 17 | INFO | Non-constant-time HMAC compares | **Fixed** | `lib/tg-auth.ts`, `lib/tg-session.ts` (`timingSafeEqual`) |
| 18 | INFO | Upload routes returned 403 vs admin 404 (existence leak) | **Fixed** | both `/api/admin/*/upload` routes → 404 |

### Detail of applied fixes

- **#1 Economy (Fixed).** New `spendPoints()` (`lib/economy.ts`) does an atomic conditional
  `UPDATE … WHERE points_balance >= amount` and treats 0 affected rows as failure; `buyItem`
  reserves funds before recording the purchase. `buyRank` (site + bot) uses a guarded update on
  **balance AND current rank**, closing both double-spend and buy-two-ranks races. Added bot string
  `rank_changed`.
- **#2 signIn (Mitigated).** `signIn` now maps Supabase's "rate limit" error to `auth_err_rate_limit`
  (was swallowed as generic). Supabase enforces auth rate-limits server-side — owner should confirm/
  tighten them in the dashboard. A dedicated app-level throttle would need a durable attempts table
  (deferred; see below).
- **#3 bug-report (Fixed).** Client IP now taken from platform-trusted sources (`req.ip` /
  `x-vercel-forwarded-for` / `x-real-ip`), not the spoofable leftmost `x-forwarded-for`. Description
  capped at 5000 chars.
- **#4 TG session secret (Fixed, fail-closed).** In production the module now throws if neither
  `SESSION_SECRET` nor `WEBHOOK_SECRET` is set (no more `"rx-dev-secret"` literal). Owner must set
  `SESSION_SECRET` (see `.env.example`).
- **#5/#6 cron + webhook (Fixed, fail-closed).** Shared `checkCronAuth()` rejects when `CRON_SECRET`
  is unset (503) and on Bearer mismatch (401). Bot webhook returns 503 when `WEBHOOK_SECRET` is unset.
- **#7/#8 link codes.** One-time use is now atomic (compare-and-swap `UPDATE … WHERE used_at IS
  NULL RETURNING`). A best-effort per-auth-user attempt cap (8 / 10 min, in-memory) was added; a
  durable cross-instance cap needs a table (deferred — brute-force is already impractical per
  verification).
- **#9 headers (Fixed; CSP deferred).** `next.config.mjs` now sets `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (geolocation=self for web
  check-in), HSTS, and `poweredByHeader:false`. **CSP intentionally not enforced yet** — its allowlist
  must be tuned against the Telegram Login Widget (oauth.telegram.org), Supabase Storage and fonts,
  and deploy=prod; enable it later (start Report-Only).
- **#10 gallery upload (Fixed).** Files are validated by magic bytes (JPEG/PNG/GIF/WEBP only); SVG and
  any non-raster content are rejected; stored content-type and extension come from the verified bytes,
  never from client `file.type` / filename.
- **#12 (Fixed).** `webCheckin` now requires `game.status === 'announced'`.
- **#13 (Mitigated).** Post-insert capacity re-check rolls back this registration if over capacity.
  A fully atomic guarantee needs a DB function/constraint (accepted partial for a low-concurrency site).
- **#14 (Fixed).** Shared `normalizeCallsign()` (NFC, 2–32, control/bidi rejection, charset
  whitelist) applied on both site and bot; bot callsign uniqueness made case-insensitive (ilike).
  `free_seats` clamped to 0–8 int; `from_place` capped at 80 chars (site + bot).
- **#16 (Fixed, additive).** `ensurePlayer` prefers an immutable `master_tg_id` setting when present;
  falls back to `master_username` otherwise (no lockout). Owner should set `master_tg_id` to fully
  close username-squatting.
- **#17/#18 (Fixed).** `crypto.timingSafeEqual` for both HMAC comparisons; upload routes return 404
  (not 403) for non-admins, matching the admin `notFound()` convention.

## Refuted by adversarial verification (no action)
1. TG-cookie-before-email precedence — security-neutral (cookie is HMAC-bound to a verified player).
2. Webhook fail-open "HIGH, exploitable now" — secret is set; downgraded to #6 hardening.
3. Master bootstrap via *forged* update — false premise (HMAC/webhook-secret gated); real residual is
   username-squatting → addressed by #16.
4. "Stale session snapshot widens every spend race" — duplicate of #1/#2; writes re-read live row.
5. `webCheckin` 500 on missing location — unreachable (FK RESTRICT, lat/lng NOT NULL).
6. confirm-route host-header — not exploitable (relative redirects; Vercel host routing).
7. redeemLinkCode brute-force as MEDIUM — keyspace+TTL make it impractical → low (#7).

## Confirmed clean (no action)
Admin authZ (every admin action gates `requirePerm`/`requireMaster` first); IDOR (actor always from
session, never FormData); XSS (no `dangerouslySetInnerHTML`; UGC escaped; achievement SVG = inert
`data:` `<img>`); Telegram-login HMAC correctness + freshness; upload authZ + path-traversal safety;
SSRF (fetch targets fixed `api.telegram.org`); open-redirect (`returnTo` allowlisted); secrets not in
client bundle; `.gitignore` covers `.env`; Supabase errors mapped to i18n keys.

## Owner action items (Vercel / Supabase — required for some fixes to fully hold)
- **`SESSION_SECRET`** — set a high-entropy value in **all** envs incl. **preview** (closes #4).
- **`NEXT_PUBLIC_SITE_URL`** = `https://www.rxteam.pl` (makes the #host-header pin effective; #2/#9).
- **`CRON_SECRET`** + **`WEBHOOK_SECRET`** — ensure set in all envs; confirm `setWebhook` used the
  same `WEBHOOK_SECRET` (#5/#6).
- **`master_tg_id`** — set to the founder's numeric Telegram id in `settings` (closes #16 fully).
- Run optional **`supabase/etap31.sql`** for the `points_balance >= 0` backstop (#15).
- Supabase dashboard: confirm Auth rate-limits enabled (#2); Auth URL allowlist limited to
  `https://www.rxteam.pl/*`; Storage buckets `gallery`/`marketplace` are public-read, **not**
  public-write; consider serving uploads with `Content-Disposition: attachment` / nosniff.

## Deferred / accepted (backlog)
- **Enforcing CSP** (#9) — tune allowlist + enable (Report-Only first).
- **Web captcha** on signIn / signUp / bug-report (#2/#3) — needs UI; rate-limiting is the
  load-bearing control already in place.
- **Durable cross-instance rate-limit** table for link redemption / auth (#7/#2).
- **Fully atomic registration capacity** via DB function (#13).
- **Geofence trust** (#11) — accepted limitation of client geolocation; prefer admin manual check-in
  as the authoritative source; consider not publishing exact coordinates until check-in opens.

## Verification performed
- `npx tsc --noEmit` passes after all edits.
- Attack paths re-walked: concurrent `buyItem`/`buyRank` now blocked by the `gte`/rank-guarded
  update (0 rows → no purchase); cron/webhook return 401/503 without their secret; gallery SVG
  rejected by magic-byte sniff; forged-Host email link no longer possible (origin pinned);
  link-code one-time-use is now a single atomic claim.
