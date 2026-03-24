import { CashflowLedger } from "../../components/cashflow-ledger";
import { getSpectatorActivityData } from "../../lib/public-wallet";

export default async function CashflowPage() {
  const activity = await getSpectatorActivityData();

  return (
    <div className="page-stack">
      <section className="panel page-lead">
        <div>
          <p className="panel-kicker">现金流</p>
          <h2>把公开钱包活动放在一条时间带里看</h2>
        </div>
        <p className="panel-note">
          这一页展示的是 Polymarket 今天公开暴露出来的现金流变化：成交和 redeem。它不会完整重建 bridge 的资金历史。
        </p>
      </section>

      <CashflowLedger initialData={activity} />
    </div>
  );
}
