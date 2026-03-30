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
  getSpectatorClosedPositionsData
} from "../lib/public-wallet";
import { loadEquityHistory } from "../lib/equity-history";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [overview, positions, trades, closedPositions, equityHistory] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getSpectatorClosedPositionsData(),
    loadEquityHistory()
  ]);

  return (
    <div className="dash-page">
      <DashboardHeader initialData={overview} />

      <DashboardEquityChart
        initialEquityHistory={equityHistory}
      />

      <DashboardThesis />

      <DashboardPositions
        initialData={positions}
        totalEquityUsd={overview.total_equity_usd}
      />

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
