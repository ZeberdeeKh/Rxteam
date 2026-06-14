import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RX Team",
  description: "ASG / Airsoft community — Wrocław",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
