import { describe, expect, it } from "vitest";
import {
  buildStatelessRunIdentityRows,
  buildStatelessOverview,
  computeExchangeBuyMinNotionalUsd,
  calculatePositionPnlPct,
  calculatePositionValueUsd,
  isBelowExchangeBuyMinimum,
  isBelowExchangeSellMinimum
} from "./live-test-stateless-helpers.ts";

describe("stateless live test helpers", () => {
  it("computes the exchange minimum buy notional from best ask and min order size", () => {
    expect(computeExchangeBuyMinNotionalUsd({
      bestAsk: 0.43,
      minOrderSize: 5
    })).toBeCloseTo(2.15);
  });

  it("returns null when exchange sizing metadata is unavailable", () => {
    expect(computeExchangeBuyMinNotionalUsd({
      bestAsk: null,
      minOrderSize: 5
    })).toBeNull();
  });

  it("builds a capped overview from collateral and open exposure", () => {
    const overview = buildStatelessOverview({
      collateralBalanceUsd: 18,
      bankrollCapUsd: 20,
      positions: [
        {
          id: "position-1",
          event_slug: "demo-event",
          market_slug: "demo-market",
          token_id: "token-1",
          side: "BUY",
          outcome_label: "Yes",
          size: 1,
          avg_cost: 0.4,
          current_price: 0.6,
          current_value_usd: 0.6,
          unrealized_pnl_pct: 0.5,
          stop_loss_pct: 0.3,
          opened_at: "2026-03-16T00:00:00.000Z",
          updated_at: "2026-03-16T00:00:00.000Z"
        }
      ]
    });

    expect(overview.cash_balance_usd).toBe(18);
    expect(overview.total_equity_usd).toBe(18.6);
    expect(overview.open_positions).toBe(1);
  });

  it("blocks buys below the exchange minimum order size", () => {
    expect(isBelowExchangeBuyMinimum({
      notionalUsd: 1.2,
      bestAsk: 0.43,
      minOrderSize: 5
    })).toBe(true);
    expect(isBelowExchangeBuyMinimum({
      notionalUsd: 2.15,
      bestAsk: 0.43,
      minOrderSize: 5
    })).toBe(false);
  });

  it("blocks sells below the exchange minimum share size", () => {
    expect(isBelowExchangeSellMinimum({
      size: 4.9,
      minOrderSize: 5
    })).toBe(true);
    expect(isBelowExchangeSellMinimum({
      size: 5,
      minOrderSize: 5
    })).toBe(false);
  });

  it("surfaces execution mode and decision strategy in terminal summary rows", () => {
    expect(buildStatelessRunIdentityRows({
      executionMode: "live",
      decisionStrategy: "pulse-direct"
    })).toEqual([
      ["Execution Mode", "live"],
      ["Decision Strategy", "pulse-direct"]
    ]);
  });

  it("computes position value and pnl from market price", () => {
    expect(calculatePositionValueUsd(2, 0.37)).toBeCloseTo(0.74);
    expect(calculatePositionPnlPct(0.4, 0.5)).toBeCloseTo(0.25);
  });
});
