"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleToggle } from "./locale-toggle";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/positions", label: "Positions" },
  { href: "/pnl", label: "P&L" },
  { href: "/trades", label: "Trades" },
  { href: "/cashflow", label: "Cashflow" },
  { href: "/runs", label: "Runs" },
  { href: "/reports", label: "Reports" }
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <div className="dash-logo-group">
            <span className="dash-logo">Hourglass</span>
            <span className="dash-logo-tagline">On-chain Signal x Prediction Market</span>
          </div>
          <span className="dash-logo-badge">AVE Claw</span>
        </div>
        <nav className="dash-nav">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href as never}
                className={`dash-nav-link ${active ? "dash-nav-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <LocaleToggle />
      </header>
      <main className="dash-main">{children}</main>
      <footer className="dash-footer">
        <span>AVE Claw Hackathon 2026 | Powered by AVE.ai + Polymarket</span>
        <a
          href="https://github.com/anthropics/ave-hackathon"
          target="_blank"
          rel="noopener noreferrer"
          className="dash-footer-link"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
