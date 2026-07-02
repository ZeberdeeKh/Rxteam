/** @type {import('next').NextConfig} */

// Базові security-заголовки (defense-in-depth). Примітка: enforcing Content-Security-Policy
// НАВМИСНО ще не вмикаємо — її allowlist треба відтестувати проти Telegram Login Widget
// (oauth.telegram.org), Supabase Storage та шрифтів, а деплой іде одразу в прод. Вмикати
// CSP окремим кроком (спершу Report-Only). geolocation=(self) — бо веб чек-ін використовує
// браузерну геолокацію; camera/microphone не використовуються.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig = {
  poweredByHeader: false, // не світити X-Powered-By: Next.js (fingerprinting)
  // resvg-js має нативний бінарник — тримаємо його зовнішнім, щоб .node потрапив у
  // serverless-бандл (інакше на Vercel рендер PNG-картки впаде «module not found»).
  experimental: { serverComponentsExternalPackages: ["@resvg/resvg-js"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
