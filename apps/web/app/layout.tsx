import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "../components/shell";
import { isSpectatorWalletMode } from "../lib/public-wallet";

export const metadata: Metadata = {
  title: "Polymarket 钱包围观台",
  description: "一个只读公开页面，用来查看单个 Polymarket 钱包的持仓、成交、现金流和推导后的 P&L。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const spectatorMode = isSpectatorWalletMode();

  return (
    <html lang="en">
      <body>
        <Shell spectatorMode={spectatorMode}>{children}</Shell>
      </body>
    </html>
  );
}
