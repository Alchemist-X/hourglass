import type { AveAlert } from "@autopoly/contracts";
import { AveMonitoringPanel } from "../components/ave-monitoring-panel";
import { DashboardActivity } from "../components/dashboard-activity";
import { DashboardEquityChart } from "../components/dashboard-equity-chart";
import { DashboardHeader } from "../components/dashboard-header";
import { DashboardPnlSummary } from "../components/dashboard-pnl-summary";
import { DashboardPositions } from "../components/dashboard-positions";
import { DashboardThesis } from "../components/dashboard-thesis";
import { DecisionReasoningPanel } from "../components/decision-reasoning-panel";
import {
  getPublicOverviewData,
  getPublicPositionsData,
  getPublicTradesData,
  getSpectatorActivityData,
  getSpectatorClosedPositionsData
} from "../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchAveAlerts(): Promise<readonly AveAlert[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const response = await fetch(`${baseUrl}/api/public/ave-alerts`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json() as { alerts?: AveAlert[] };
    return data.alerts ?? [];
  } catch {
    return [];
  }
}

interface DecisionReasoningData {
  readonly id: string;
  readonly marketQuestion: string;
  readonly token: "BTC" | "ETH";
  readonly currentPrice: number;
  readonly targetPrice: number;
  readonly signals: {
    readonly price: { readonly value: number; readonly label: string; readonly detail: string };
    readonly trend: { readonly value: number; readonly label: string; readonly detail: string };
    readonly whale: { readonly value: number; readonly label: string; readonly detail: string };
    readonly sentiment: { readonly value: number; readonly label: string; readonly detail: string };
  };
  readonly overallScore: number;
  readonly ourProbability: number;
  readonly marketProbability: number;
  readonly edge: number;
  readonly action: "BUY" | "SELL" | "SKIP";
  readonly shares?: number;
  readonly status: "executed" | "pending" | "skipped";
  readonly timestamp: string;
}

async function fetchDecisions(): Promise<readonly DecisionReasoningData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const response = await fetch(`${baseUrl}/api/public/decisions`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json() as { decisions?: DecisionReasoningData[] };
    return data.decisions ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [overview, positions, trades, closedPositions, activities, alerts, decisions] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getSpectatorClosedPositionsData(),
    getSpectatorActivityData(),
    fetchAveAlerts(),
    fetchDecisions()
  ]);

  return (
    <div className="dash-page">
      <DashboardHeader initialData={overview} />

      <DashboardEquityChart
        initialActivities={activities}
        initialPositions={positions}
      />

      <DashboardThesis />

      <DashboardPositions
        initialData={positions}
        totalEquityUsd={overview.total_equity_usd}
      />

      <AveMonitoringPanel alerts={alerts} />

      <DecisionReasoningPanel decisions={decisions} />

      <div className="dash-split">
        <DashboardPnlSummary
          initialPositions={positions}
          initialClosedPositions={closedPositions}
        />
        <DashboardActivity initialData={trades} />
      </div>
    </div>
  );
}
