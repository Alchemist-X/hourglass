import { PnlPortfolio } from "../../components/pnl-portfolio";
import {
  getPublicOverviewData,
  getPublicPositionsData,
  getPublicTradesData,
  getSpectatorClosedPositionsData,
  isSpectatorInternalLedgerMode,
  isSpectatorWalletMode
} from "../../lib/public-wallet";

export default async function PnlPage() {
  const spectatorMode = isSpectatorWalletMode();
  const spectatorInternalLedgerMode = isSpectatorInternalLedgerMode();
  const [overview, positions, trades, closedPositions] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getSpectatorClosedPositionsData()
  ]);

  return (
    <div className="page-stack">
      <section className="lead-grid">
        <div className="panel page-lead page-lead-primary">
          <div>
            <p className="panel-kicker">组合</p>
            <h2>不用翻原始成交，也能看懂赚亏和暴露</h2>
          </div>
          <p className="panel-note">
            {spectatorMode
              ? spectatorInternalLedgerMode
                ? "这一页优先使用内部 snapshot、持仓和成交账本来解释账户表现；已平仓 realized P&L 仍会补公共 closed-position 数据。这样总额和暴露口径会更严，但资金流水仍不是最终完整版。"
                : "这一页是更深入的分析页。它会把账户总额、cost basis、未实现 P&L、已实现 P&L 和仓位贡献拆开，方便围观者看清楚现在到底是谁在拉动账户表现。"
              : "这个页面会严格使用当前价格、平均成本和持仓库存来计算未实现 P&L。"}
          </p>
        </div>

        <aside className="panel page-brief">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">口径</p>
              <h2>P&L 数据说明</h2>
            </div>
          </div>
          <dl className="brief-grid">
            <div>
              <dt>未实现</dt>
              <dd>当前公开价格减去开仓平均成本，作用在未平仓库存上。</dd>
            </div>
            <div>
              <dt>已实现</dt>
              <dd>{spectatorInternalLedgerMode ? "已平仓部分仍补公共 feed 里的 closed-position 记录。" : "来自公开 feed 里的 closed-position 记录。"}</dd>
            </div>
            <div>
              <dt>仍不完整的部分</dt>
              <dd>{spectatorMode ? "bridge 资金历史仍不完整。" : "这个内部视图没有额外缺口。"}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <PnlPortfolio
        initialOverview={overview}
        initialPositions={positions}
        initialTrades={trades}
        initialClosedPositions={closedPositions}
        spectatorMode={spectatorMode}
        detailed
      />
    </div>
  );
}
