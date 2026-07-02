// Рендер публічної картки гравця у PNG (для шерингу в сторіс). Серверний.
// SVG-шаблон (плоский тактичний стиль ab3: темний фон, помаранч) → resvg → PNG.
// Шрифт Inter вбудований у код (resvg на serverless не має системних шрифтів).
// QR (веде на /u/<callsign>) вкладаємо як PNG-<image>.
import { Resvg } from "@resvg/resvg-js";
import QRCode from "qrcode";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { st, type Lang } from "./site-i18n";
import { formatDateOnly } from "./games";
import { INTER_BOLD_B64 } from "./assets/inter-font";
import type { PlayerCardData } from "./player-card";

// resvg-js вантажить шрифт із ФАЙЛУ (fontFiles), не з буфера → пишемо вбудований TTF
// у tmp один раз на процес (на Vercel /tmp записуваний, тому це працює й на serverless).
const FONT_PATH = join(tmpdir(), "rxteam-inter-700.ttf");
let fontReady = false;
function ensureFont(): void {
  if (fontReady) return;
  if (!existsSync(FONT_PATH)) writeFileSync(FONT_PATH, Buffer.from(INTER_BOLD_B64, "base64"));
  fontReady = true;
}

const W = 1080;
const H = 1920;
const CX = W / 2;
const ORANGE = "#f97316";
const BG = "#0d0d0f";
const WHITE = "#f5f5f5";
const GRAY = "#9a9aa2";

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSvg(d: PlayerCardData, lang: Lang, qrDataUrl: string): string {
  const relV = d.reliabilityPct === null ? "—" : `${d.reliabilityPct}%`;
  const placeV = d.place === null ? "—" : `#${d.place}`;
  const stats: [string, string][] = [
    [String(d.gamesPlayed), st(lang, "ranking_col_games")],
    [relV, st(lang, "card_reliability")],
    [placeV, st(lang, "card_place")],
  ];
  const colX = [CX - 300, CX, CX + 300];
  const statsSvg = stats
    .map(
      ([v, l], i) =>
        `<text x="${colX[i]}" y="1000" text-anchor="middle" font-size="104" fill="${ORANGE}">${esc(v)}</text>` +
        `<text x="${colX[i]}" y="1058" text-anchor="middle" font-size="32" letter-spacing="2" fill="${GRAY}">${esc(
          l.toUpperCase(),
        )}</text>`,
    )
    .join("");

  // Дві дати в один рядок не влазять у 1080px → рендеримо окремими рядками.
  const metaParts = [
    d.hasPatch
      ? d.patchAt
        ? st(lang, "card_patch_since", { date: formatDateOnly(d.patchAt) })
        : st(lang, "card_patch")
      : null,
    d.registeredAt ? st(lang, "card_registered_since", { date: formatDateOnly(d.registeredAt) }) : null,
  ].filter(Boolean) as string[];

  const rankSvg = d.rank
    ? `<text x="${CX}" y="650" text-anchor="middle" font-size="46" letter-spacing="3" fill="${ORANGE}">${esc(
        d.rank.toUpperCase(),
      )}</text>`
    : "";
  const metaSvg = metaParts
    .map(
      (line, i) =>
        `<text x="${CX}" y="${1150 + i * 56}" text-anchor="middle" font-size="36" fill="${GRAY}">${esc(
          line,
        )}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter" font-weight="700">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="0" y="0" width="${W}" height="14" fill="${ORANGE}"/>
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="${ORANGE}"/>
  <text x="60" y="112" font-size="44" letter-spacing="6" fill="${ORANGE}">RX TEAM</text>
  <text x="${W - 60}" y="112" text-anchor="end" font-size="34" fill="${GRAY}">rxteam.pl</text>

  <text x="${CX}" y="560" text-anchor="middle" font-size="128" fill="${WHITE}">${esc(d.callsign.toUpperCase())}</text>
  ${rankSvg}

  ${statsSvg}
  ${metaSvg}

  <rect x="${CX - 190}" y="1420" width="380" height="380" rx="28" fill="#ffffff"/>
  <image x="${CX - 160}" y="1450" width="320" height="320" href="${qrDataUrl}"/>
  <text x="${CX}" y="1878" text-anchor="middle" font-size="32" fill="${GRAY}">${esc(
    st(lang, "card_scan_hint"),
  )}</text>
</svg>`;
}

// PNG картки гравця. profileUrl — публічне посилання (/u/<callsign>), що кодується в QR.
export async function renderCardPng(
  d: PlayerCardData,
  lang: Lang,
  profileUrl: string,
): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    margin: 0,
    width: 340,
    color: { dark: "#0d0d0f", light: "#ffffff" },
  });
  ensureFont();
  const svg = buildSvg(d, lang, qrDataUrl);
  const resvg = new Resvg(svg, {
    font: { fontFiles: [FONT_PATH], defaultFontFamily: "Inter", loadSystemFonts: false },
    fitTo: { mode: "original" },
  });
  return resvg.render().asPng();
}
