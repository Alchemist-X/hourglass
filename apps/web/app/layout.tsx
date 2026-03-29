import type { Metadata } from "next";
import "./globals.css";
import { DashboardShell } from "../components/dashboard-shell";

export const metadata: Metadata = {
  title: "AutoPoly Live Dashboard",
  description: "Live trading dashboard for an autonomous Polymarket agent. View positions, P&L, and recent activity in real time."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="dash-body">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
