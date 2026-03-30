import { DashboardActivity } from "../components/dashboard-activity";
import { DashboardEquityChart } from "../components/dashboard-equity-chart";
import { DashboardHeader } from "../components/dashboard-header";
import { DashboardPnlSummary } from "../components/dashboard-pnl-summary";
import { DashboardPositions } from "../components/dashboard-positions";
import {
  getPublicOverviewData,
  getPublicPositionsData,
  getPublicTradesData,
  getSpectatorClosedPositionsData
} from "../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [overview, positions, trades, closedPositions] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getSpectatorClosedPositionsData()
  ]);

  return (
    <div className="dash-page">
      <DashboardHeader initialData={overview} />

      <section className="dash-panel dash-thesis">
        <h2>Why Agents Trade Prediction Markets</h2>
        <p>
          This system is built around <strong>Market Pulse</strong> — AI autonomously
          estimates event probabilities, compares them against market-implied odds,
          and generates trade signals based on edge and capital efficiency (monthly return).
        </p>
        <div className="dash-thesis-points">
          <div className="dash-thesis-point">
            <strong>Reasoning at parity</strong>
            <span>No clear evidence that humans have an edge in forecasting. Given the same context, agents perform comparably — and they never sleep.</span>
          </div>
          <div className="dash-thesis-point">
            <strong>Breadth beats depth</strong>
            <span>Agents cover thousands of markets simultaneously, catching mispricings that no individual can monitor. Human reaction latency is 3+ minutes; agents act in seconds.</span>
          </div>
          <div className="dash-thesis-point">
            <strong>Competition window</strong>
            <span>In political and tech prediction markets, participants lack clear pricing models and fear inventory risk. Large-scale agent trading faces little competition today.</span>
          </div>
        </div>
      </section>

      <DashboardEquityChart points={overview.equity_curve} />

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
