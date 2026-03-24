import { CashflowLedger } from "../components/cashflow-ledger";
import { LiveOverview } from "../components/live-overview";
import { LiveRuns } from "../components/live-runs";
import { PnlPortfolio } from "../components/pnl-portfolio";
import { ReportsList } from "../components/reports-list";
import { formatUsd } from "../lib/format";
import {
  getPublicOverviewData,
  getPublicPositionsData,
  getPublicRunsData,
  getPublicTradesData,
  getReportsData,
  getSpectatorActivityData,
  getSpectatorClosedPositionsData,
  getSpectatorProfileData,
  isSpectatorInternalLedgerMode,
  isSpectatorWalletMode
} from "../lib/public-wallet";

function shortenAddress(address: string | null | undefined): string {
  if (!address) {
    return "Not available";
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default async function HomePage() {
  const spectatorMode = isSpectatorWalletMode();
  const spectatorInternalLedgerMode = isSpectatorInternalLedgerMode();
  const [overview, positions, trades, runs, reports, profile, activity, closedPositions] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getPublicRunsData(),
    getReportsData(),
    getSpectatorProfileData(),
    getSpectatorActivityData(),
    getSpectatorClosedPositionsData()
  ]);

  return (
    <div className="page-stack">
      <section className="lead-grid">
        <div className="panel page-lead page-lead-primary">
          <div>
            <p className="panel-kicker">{spectatorMode ? "钱包围观" : "围观面板"}</p>
            <h2>
              {spectatorMode
                ? `${profile?.display_name ?? "钱包"}：一个能看懂的账户视图`
                : "一个只读页面看完实时净值、持仓、成交和报告。"}
            </h2>
          </div>
          <p className="panel-note">
            {spectatorMode
              ? spectatorInternalLedgerMode
                ? "这个部署围绕一个公开的 Polymarket 钱包展开，但账户总额、当前持仓和成交会优先使用内部执行账本与快照。这样围观页看到的是更接近真实账户状态的数字，而不是只靠公共接口拼出来的近似值。"
                : "这个部署围绕一个公开的 Polymarket 钱包展开。它优先回答三个问题：这个钱包现在持有什么、刚刚交易了什么、按当前价格看大概赚亏多少。"
              : "这个站点会轮询公共接口，让外部用户在不接触管理权限的前提下看到账户变化。"}
          </p>
          <p className="panel-note">
            {spectatorMode
              ? spectatorInternalLedgerMode
                ? "这里会优先展示内部账本里的账户总额、持仓和成交；已平仓 realized P&L 与 activity 仍会补公共 feed。暂时不完整的部分，仍然是 bridge 出入金历史。"
                : "这里包含：当前持仓、最近成交、redeem 记录，以及已平仓的 realized P&L。这里暂时不完整的部分：bridge 出入金历史。"
              : "这个页面对外保持只读，实际操作控制仍然和公开围观界面分开。"}
          </p>
        </div>

        <aside className="panel page-brief">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">一眼看完</p>
              <h2>{spectatorMode ? "这个页面里哪些数字最值得先看" : "页面摘要"}</h2>
            </div>
          </div>
          <dl className="brief-grid">
            <div>
              <dt>钱包</dt>
              <dd className="table-code">{shortenAddress(profile?.address)}</dd>
            </div>
            <div>
              <dt>账户总额</dt>
              <dd>{formatUsd(overview.total_equity_usd)}</dd>
            </div>
            <div>
              <dt>当前持仓市场</dt>
              <dd>{positions.length}</dd>
            </div>
            <div>
              <dt>活动记录数</dt>
              <dd>{activity.length}</dd>
            </div>
            <div>
              <dt>主页</dt>
              <dd>
                {spectatorMode && profile ? (
                  <a className="action-link" href={profile.profile_url} target="_blank" rel="noreferrer">去 Polymarket 主页</a>
                ) : "未公开"}
              </dd>
            </div>
            <div>
              <dt>现金部分</dt>
              <dd>{spectatorMode ? (spectatorInternalLedgerMode ? "内部快照优先" : "已并入总额") : "内部跟踪"}</dd>
            </div>
          </dl>
        </aside>
      </section>

      {spectatorMode ? (
        <section className="glance-grid">
          <article className="glance-card">
            <p className="panel-kicker">持仓</p>
            <h3>看的是账户规模，不只是仓位列表</h3>
            <p>{spectatorInternalLedgerMode ? "最上面的金额优先来自内部账本快照，不再只靠公开持仓市值和链上 USDC 去近似猜。这样账户总额会更贴近真实运行状态。" : "最上面的金额不再只是持仓市值，而是尽量把可见的 cash 也并进去，让人一眼就知道这个账户现在大概有多少钱。"}</p>
          </article>
          <article className="glance-card">
            <p className="panel-kicker">活动</p>
            <h3>成交和 redeem 放在同一条时间带里</h3>
            <p>现金流页面只展示公共接口今天真正能拿到的事件，不假装自己已经完整还原了一整本资金流水账。</p>
          </article>
          <article className="glance-card">
            <p className="panel-kicker">边界</p>
            <h3>公共数据依然有盲区</h3>
            <p>{spectatorInternalLedgerMode ? "即便接上内部账本，bridge 入金和出金历史仍然需要单独的现金流水层来讲完整；当前页面已经比纯公共模式更严，但还不是最终账本页。" : "bridge 入金和出金历史仍然不是完整公开的，所以这个站会尽量把能确认的 cash 算进去，但不会把看不到的部分伪装成精确数字。"}</p>
          </article>
        </section>
      ) : null}

      <div className="dashboard-grid">
        <LiveOverview initialData={overview} />
        <PnlPortfolio
          initialOverview={overview}
          initialPositions={positions}
          initialTrades={trades}
          initialClosedPositions={closedPositions}
          spectatorMode={spectatorMode}
        />
      </div>

      {spectatorMode ? (
        <CashflowLedger initialData={activity} />
      ) : (
        <div className="dashboard-grid dashboard-grid-secondary">
          <LiveRuns
            initialData={runs}
          />
          <ReportsList
            initialData={reports.map((report) => ({
              ...report,
              published_at_utc: String(report.published_at_utc)
            }))}
            endpoint="/api/public/reports"
            title="Pulse, review, monitor, and rebalance artifacts"
            kicker="Reports"
          />
        </div>
      )}
    </div>
  );
}
