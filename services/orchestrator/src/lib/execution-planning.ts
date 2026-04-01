import type {
  OverviewResponse,
  PublicPosition,
  TradeDecision
} from "@autopoly/contracts";
import { inferPaperSellAmount } from "@autopoly/contracts";
import type { OrchestratorConfig } from "../config.js";
import { applyTradeGuardsDetailed, type TradeGuardResult } from "./risk.js";

export interface PlanningOrderBookSnapshot {
  bestAsk: number | null;
  bestBid: number | null;
  minOrderSize: number | null;
}

export interface PlannedExecution {
  action: TradeDecision["action"];
  marketSlug: string;
  eventSlug: string;
  tokenId: string;
  side: TradeDecision["side"];
  notionalUsd: number;
  bankrollRatio: number;
  executionAmount: number;
  unit: "usd" | "shares";
  thesisMd: string;
  bestAsk: number | null;
  bestBid: number | null;
  minOrderSize: number | null;
  exchangeMinNotionalUsd: number | null;
  orderType: "FOK" | "GTC";
  gtcLimitPrice: number | null;
}

// ---------------------------------------------------------------------------
// GTC order type decision
// ---------------------------------------------------------------------------

const MAX_SPREAD_FOR_GTC = 0.05;

/**
 * Decide whether to use GTC (limit) or FOK (market) order.
 *
 * GTC is used when:
 * - The action is "open" (new position, no urgency)
 * - The market has taker fees (feeRate > 0 and not negRisk)
 * - The spread is reasonable (< 5%)
 *
 * FOK is used for everything else: close, reduce, stop-loss, fee-free
 * markets, or wide spreads.
 */
export function chooseOrderType(input: {
  action: TradeDecision["action"];
  side: TradeDecision["side"];
  bestBid: number | null;
  bestAsk: number | null;
  negRisk?: boolean;
  feeRate?: number;
}): { orderType: "FOK" | "GTC"; gtcLimitPrice: number | null } {
  // GTC disabled by default — set ENABLE_GTC_ORDERS=true to activate
  if (process.env.ENABLE_GTC_ORDERS !== "true") {
    return { orderType: "FOK", gtcLimitPrice: null };
  }

  // Always FOK for time-critical actions
  if (input.action === "close" || input.action === "reduce") {
    return { orderType: "FOK", gtcLimitPrice: null };
  }

  // Only consider GTC for opens (BUY side)
  if (input.action !== "open" || input.side !== "BUY") {
    return { orderType: "FOK", gtcLimitPrice: null };
  }

  // Fee-free markets: no savings from GTC
  if (input.negRisk || (input.feeRate != null && input.feeRate === 0)) {
    return { orderType: "FOK", gtcLimitPrice: null };
  }

  const bid = input.bestBid;
  const ask = input.bestAsk;
  if (bid == null || ask == null || bid <= 0 || ask <= 0) {
    return { orderType: "FOK", gtcLimitPrice: null };
  }

  const spread = (ask - bid) / ask;
  if (spread > MAX_SPREAD_FOR_GTC) {
    return { orderType: "FOK", gtcLimitPrice: null };
  }

  // Calculate limit price based on spread width
  let limitPrice: number;
  if (spread <= 0.01) {
    // Tight spread: bid + 1 tick (aggressive, likely to fill quickly)
    limitPrice = bid + 0.001;
  } else if (spread <= 0.03) {
    // Normal spread: mid-price
    limitPrice = (bid + ask) / 2;
  } else {
    // Wide spread: bid + 30% of spread (conservative)
    limitPrice = bid + (ask - bid) * 0.3;
  }

  // Round to 3 decimal places (Polymarket tick size)
  limitPrice = Math.round(limitPrice * 1000) / 1000;

  return { orderType: "GTC", gtcLimitPrice: limitPrice };
}

export interface SkippedDecision {
  action: TradeDecision["action"] | null;
  marketSlug: string;
  tokenId: string | null;
  reason: string;
}

function roundNotional(value: number): number {
  return Number(value.toFixed(4));
}

function roundExchangeCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function computeExchangeBuyMinNotionalUsd(input: {
  bestAsk: number | null;
  minOrderSize: number | null;
}) {
  if (!(input.bestAsk != null && input.bestAsk > 0) || !(input.minOrderSize != null && input.minOrderSize > 0)) {
    return null;
  }
  return roundExchangeCurrency(input.bestAsk * input.minOrderSize);
}

export function isBelowExchangeBuyMinimum(input: {
  notionalUsd: number;
  bestAsk: number | null;
  minOrderSize: number | null;
}) {
  const minNotionalUsd = computeExchangeBuyMinNotionalUsd({
    bestAsk: input.bestAsk,
    minOrderSize: input.minOrderSize
  });
  if (!(minNotionalUsd != null && minNotionalUsd > 0)) {
    return false;
  }
  return input.notionalUsd < minNotionalUsd;
}

export function isBelowExchangeSellMinimum(input: {
  size: number;
  minOrderSize: number | null;
}) {
  if (!(input.minOrderSize != null && input.minOrderSize > 0)) {
    return false;
  }
  return input.size < input.minOrderSize;
}

export function buildOpenExecutionFloorLabel(input: {
  configuredMinTradeUsd: number;
  exchangeMinNotionalUsd: number | null;
}) {
  const labels: string[] = [];
  if (input.configuredMinTradeUsd > 0) {
    labels.push(`internal minimum ${formatUsd(input.configuredMinTradeUsd)}`);
  }
  if (input.exchangeMinNotionalUsd != null && input.exchangeMinNotionalUsd > 0) {
    labels.push(`Polymarket minimum ${formatUsd(input.exchangeMinNotionalUsd)}`);
  }
  return labels.join(" + ");
}

export function formatRiskCapReason(input: {
  guardResult: TradeGuardResult;
  requestedUsd: number;
  bankrollUsd: number;
  totalExposureUsd: number;
  eventExposureUsd: number;
  openPositions: number;
  maxPositions: number;
}): string {
  const { guardResult } = input;
  const binding = guardResult.bindingConstraint;

  switch (binding) {
    case "max_positions":
      return `blocked_by_risk_cap:max_positions: already at ${input.openPositions}/${input.maxPositions} positions`;
    case "total_exposure": {
      const detail = guardResult.constraints.find((c) => c.label === "total_exposure");
      return `blocked_by_risk_cap:total_exposure: requested ${formatUsd(input.requestedUsd)} but total exposure headroom is ${formatUsd(detail?.headroom ?? 0)} (current ${formatUsd(input.totalExposureUsd)} / max ${formatUsd(detail?.limit ?? 0)})`;
    }
    case "event_exposure": {
      const detail = guardResult.constraints.find((c) => c.label === "event_exposure");
      return `blocked_by_risk_cap:event_exposure: event already at ${formatUsd(input.eventExposureUsd)} / max ${formatUsd(detail?.limit ?? 0)}`;
    }
    case "max_trade_pct": {
      const detail = guardResult.constraints.find((c) => c.label === "max_trade_pct");
      return `blocked_by_risk_cap:max_trade_pct: bankroll cap is ${formatUsd(detail?.limit ?? 0)} per trade (${((detail?.limit ?? 0) / Math.max(input.bankrollUsd, 1) * 100).toFixed(0)}% of ${formatUsd(input.bankrollUsd)})`;
    }
    case "liquidity_cap": {
      const detail = guardResult.constraints.find((c) => c.label === "liquidity_cap");
      return `blocked_by_risk_cap:liquidity_cap: market liquidity caps executable amount at ${formatUsd(detail?.headroom ?? 0)}`;
    }
    case "min_trade": {
      const detail = guardResult.constraints.find((c) => c.label === "min_trade");
      return `blocked_by_risk_cap:min_trade: post-guard amount is below minimum trade size ${formatUsd(detail?.limit ?? 0)}`;
    }
    default:
      return "blocked_by_risk_cap: reduced the maximum executable notional to zero";
  }
}

export function shouldWarnSkippedDecision(reason: string) {
  return reason.startsWith("blocked_by_risk_cap:")
    || reason.startsWith("blocked_by_strategy_min_trade:")
    || reason.startsWith("blocked_by_exchange_min:");
}

export async function buildExecutionPlan(input: {
  decisions: TradeDecision[];
  positions: PublicPosition[];
  overview: OverviewResponse;
  config: Pick<
    OrchestratorConfig,
    "decisionStrategy" | "maxTradePct" | "maxTotalExposurePct" | "maxEventExposurePct" | "maxPositions"
  >;
  minTradeUsd: number;
  readBook: (tokenId: string) => Promise<PlanningOrderBookSnapshot | null>;
}) {
  const plans: PlannedExecution[] = [];
  const skipped: SkippedDecision[] = [];
  const usePulseDirectEmptyPortfolioGuards =
    input.config.decisionStrategy === "pulse-direct" && input.positions.length === 0;
  let projectedTotalExposureUsd = input.positions.reduce((sum, position) => sum + position.current_value_usd, 0);
  let projectedOpenPositions = input.overview.open_positions;
  const eventExposureUsd = new Map<string, number>();
  for (const position of input.positions) {
    eventExposureUsd.set(
      position.event_slug,
      (eventExposureUsd.get(position.event_slug) ?? 0) + position.current_value_usd
    );
  }

  for (const decision of input.decisions) {
    if (!["open", "close", "reduce"].includes(decision.action)) {
      continue;
    }

    if (decision.action === "open") {
      const book = await input.readBook(decision.token_id);
      if (!(book?.bestAsk != null && book.bestAsk > 0)) {
        skipped.push({
          action: decision.action,
          marketSlug: decision.market_slug,
          tokenId: decision.token_id,
          reason: "blocked_by_orderbook_unavailable: no executable ask book is available from Polymarket"
        });
        continue;
      }
      const exchangeMinNotionalUsd = computeExchangeBuyMinNotionalUsd({
        bestAsk: book.bestAsk,
        minOrderSize: book.minOrderSize ?? null
      });
      const openExecutionFloorLabel = buildOpenExecutionFloorLabel({
        configuredMinTradeUsd: input.minTradeUsd,
        exchangeMinNotionalUsd
      });
      const currentEventExposureUsd = eventExposureUsd.get(decision.event_slug) ?? 0;
      const currentOpenPositions = usePulseDirectEmptyPortfolioGuards ? 0 : projectedOpenPositions;
      const currentTotalExposureUsd = usePulseDirectEmptyPortfolioGuards ? 0 : projectedTotalExposureUsd;
      const guardResult = applyTradeGuardsDetailed({
        requestedUsd: decision.notional_usd,
        bankrollUsd: input.overview.total_equity_usd,
        minTradeUsd: input.minTradeUsd,
        maxTradePct: input.config.maxTradePct,
        liquidityCapUsd: decision.liquidity_cap_usd ?? decision.notional_usd,
        totalExposureUsd: currentTotalExposureUsd,
        maxTotalExposurePct: usePulseDirectEmptyPortfolioGuards ? 1 : input.config.maxTotalExposurePct,
        eventExposureUsd: currentEventExposureUsd,
        maxEventExposurePct: input.config.maxEventExposurePct,
        openPositions: currentOpenPositions,
        maxPositions: usePulseDirectEmptyPortfolioGuards ? Number.MAX_SAFE_INTEGER : input.config.maxPositions
      });
      const rawGuardedNotionalUsd = guardResult.amount;
      if (!(rawGuardedNotionalUsd > 0)) {
        const belowConfiguredMinTrade = input.minTradeUsd > 0 && decision.notional_usd + 1e-9 < input.minTradeUsd;
        skipped.push({
          action: decision.action,
          marketSlug: decision.market_slug,
          tokenId: decision.token_id,
          reason: belowConfiguredMinTrade
            ? `blocked_by_strategy_min_trade: Kelly-sized order is ${formatUsd(roundNotional(decision.notional_usd))}, below internal minimum ${formatUsd(input.minTradeUsd)}`
            : formatRiskCapReason({
                guardResult,
                requestedUsd: decision.notional_usd,
                bankrollUsd: input.overview.total_equity_usd,
                totalExposureUsd: currentTotalExposureUsd,
                eventExposureUsd: currentEventExposureUsd,
                openPositions: currentOpenPositions,
                maxPositions: usePulseDirectEmptyPortfolioGuards ? Number.MAX_SAFE_INTEGER : input.config.maxPositions
              })
        });
        continue;
      }
      const plannedNotionalUsd = roundNotional(rawGuardedNotionalUsd);

      if (isBelowExchangeBuyMinimum({
        notionalUsd: plannedNotionalUsd,
        bestAsk: book.bestAsk,
        minOrderSize: book.minOrderSize ?? null
      })) {
        const wasCappedByRisk = plannedNotionalUsd + 1e-9 < roundNotional(decision.notional_usd);
        skipped.push({
          action: decision.action,
          marketSlug: decision.market_slug,
          tokenId: decision.token_id,
          reason: wasCappedByRisk
            ? `blocked_by_risk_cap:${guardResult.bindingConstraint}: risk limit (${guardResult.bindingConstraint}) caps this order at ${formatUsd(plannedNotionalUsd)}, but ${openExecutionFloorLabel || "the executable minimum"} is ${formatUsd(exchangeMinNotionalUsd ?? 0)} so the Polymarket order would fail`
            : `blocked_by_exchange_min: Kelly-sized order ${formatUsd(plannedNotionalUsd)} is below Polymarket minimum order size (${book.minOrderSize} shares @ ${formatUsd(book.bestAsk)} ask => ${formatUsd(exchangeMinNotionalUsd ?? 0)} minimum)`
        });
        continue;
      }

      const orderDecision = chooseOrderType({
        action: decision.action,
        side: decision.side,
        bestBid: book.bestBid ?? null,
        bestAsk: book.bestAsk ?? null,
        negRisk: (decision as any).negRisk,
        feeRate: (decision as any).feeRate
      });

      plans.push({
        action: decision.action,
        marketSlug: decision.market_slug,
        eventSlug: decision.event_slug,
        tokenId: decision.token_id,
        side: decision.side,
        notionalUsd: plannedNotionalUsd,
        bankrollRatio: input.overview.total_equity_usd > 0
          ? plannedNotionalUsd / input.overview.total_equity_usd
          : 0,
        executionAmount: plannedNotionalUsd,
        unit: "usd",
        thesisMd: decision.thesis_md,
        bestAsk: book.bestAsk ?? null,
        bestBid: book.bestBid ?? null,
        minOrderSize: book.minOrderSize ?? null,
        exchangeMinNotionalUsd,
        orderType: orderDecision.orderType,
        gtcLimitPrice: orderDecision.gtcLimitPrice
      });

      projectedTotalExposureUsd += plannedNotionalUsd;
      projectedOpenPositions += 1;
      eventExposureUsd.set(
        decision.event_slug,
        (eventExposureUsd.get(decision.event_slug) ?? 0) + plannedNotionalUsd
      );
      continue;
    }

    const currentPosition = input.positions.find((position) => position.token_id === decision.token_id) ?? null;
    const executionAmount = inferPaperSellAmount(currentPosition, decision);
    if (!(executionAmount > 0)) {
      skipped.push({
        action: decision.action,
        marketSlug: decision.market_slug,
        tokenId: decision.token_id,
        reason: "blocked_by_position_unavailable: no matching remote position is available to sell"
      });
      continue;
    }

    const book = await input.readBook(decision.token_id);
    if (isBelowExchangeSellMinimum({
      size: executionAmount,
      minOrderSize: book?.minOrderSize ?? null
    })) {
      skipped.push({
        action: decision.action,
        marketSlug: decision.market_slug,
        tokenId: decision.token_id,
        reason: `blocked_by_exchange_min: below Polymarket minimum order size (${book?.minOrderSize ?? 0} shares)`
      });
      continue;
    }
    plans.push({
      action: decision.action,
      marketSlug: decision.market_slug,
      eventSlug: decision.event_slug,
      tokenId: decision.token_id,
      side: decision.side,
      notionalUsd: roundNotional(decision.notional_usd),
      bankrollRatio: input.overview.total_equity_usd > 0
        ? decision.notional_usd / input.overview.total_equity_usd
        : 0,
      executionAmount,
      unit: "shares",
      thesisMd: decision.thesis_md,
      bestAsk: book?.bestAsk ?? null,
      bestBid: book?.bestBid ?? null,
      minOrderSize: book?.minOrderSize ?? null,
      exchangeMinNotionalUsd: null,
      orderType: "FOK",
      gtcLimitPrice: null
    });
  }

  return { plans, skipped };
}
