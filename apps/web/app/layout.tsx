import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hourglass \u2014 On-chain Signal \u00d7 Prediction Market",
  description:
    "Autonomous prediction market trading agent powered by AVE Claw on-chain signals. Whale tracking, trend analysis, anomaly detection, and intelligent position management on Polymarket.",
  metadataBase: new URL("https://autopoly-pizza-spectator.vercel.app"),
  openGraph: {
    title: "Hourglass \u2014 On-chain Signal \u00d7 Prediction Market",
    description:
      "Chain signal-driven prediction market trading agent. AVE Claw Hackathon 2026.",
    siteName: "Hourglass",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hourglass \u2014 On-chain Signal \u00d7 Prediction Market",
    description:
      "Chain signal-driven prediction market trading agent. AVE Claw Hackathon 2026.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Kreon:wght@300;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
