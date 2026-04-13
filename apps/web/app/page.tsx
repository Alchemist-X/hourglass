import type { AveAlert } from "@autopoly/contracts";
import { AveMonitoringPanel } from "../components/ave-monitoring-panel";
import { DashboardActivity } from "../components/dashboard-activity";
import { DashboardEquityChart } from "../components/dashboard-equity-chart";
import { DashboardHeader } from "../components/dashboard-header";
import { DashboardPnlSummary } from "../components/dashboard-pnl-summary";
import { DashboardPositions } from "../components/dashboard-positions";
import { DashboardThesis } from "../components/dashboard-thesis";
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

export default async function HomePage() {
  const [overview, positions, trades, closedPositions, activities, alerts] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getSpectatorClosedPositionsData(),
    getSpectatorActivityData(),
    fetchAveAlerts()
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
