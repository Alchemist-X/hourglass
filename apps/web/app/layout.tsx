import type { Metadata } from "next";
import "./globals.css";
import { DashboardShell } from "../components/dashboard-shell";
import { LocaleProvider } from "../lib/locale-context";

export const metadata: Metadata = {
  title: "Hourglass — AVE Claw DeFi Agent",
  description: "Autonomous DeFi agent powered by AVE Claw. Multi-chain token monitoring, anomaly detection, and intelligent position management.",
  metadataBase: new URL("https://autopoly-pizza-spectator.vercel.app"),
  openGraph: {
    title: "Hourglass — AVE Claw DeFi Agent",
    description: "Autonomous DeFi agent powered by AVE Claw. Multi-chain token monitoring, anomaly detection, and intelligent position management.",
    siteName: "Hourglass",
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Hourglass — AVE Claw DeFi Agent",
    description: "Autonomous DeFi agent powered by AVE Claw."
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
