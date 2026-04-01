import type { Metadata } from "next";
import "./globals.css";
import { DashboardShell } from "../components/dashboard-shell";
import { LocaleProvider } from "../lib/locale-context";

export const metadata: Metadata = {
  title: "AutoPoly — Autonomous Polymarket Trading Agent",
  description: "The world's first autonomous AI agent trading on Polymarket. Full-market coverage, long-horizon reasoning, live positions & P&L.",
  metadataBase: new URL("https://autopoly-pizza-spectator.vercel.app"),
  openGraph: {
    title: "AutoPoly — Autonomous Polymarket Trading Agent",
    description: "The world's first autonomous AI agent trading on Polymarket. Full-market coverage, long-horizon reasoning, live positions & P&L.",
    siteName: "AutoPoly",
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoPoly — Autonomous Polymarket Trading Agent",
    description: "The world's first autonomous AI agent trading on Polymarket."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="dash-body">
        <LocaleProvider>
          <DashboardShell>{children}</DashboardShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
