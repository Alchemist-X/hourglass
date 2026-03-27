import type {
  OverviewResponse,
  PublicPosition,
  TradeDecision
} from "@autopoly/contracts";
import { inferPaperSellAmount } from "@autopoly/contracts";
import type { OrchestratorConfig } from "../config.js";
import { applyTradeGuards } from "./risk.js";

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
      const rawGuardedNotionalUsd = applyTradeGuards({
        requestedUsd: decision.notional_usd,
        bankrollUsd: input.overview.total_equity_usd,
        minTradeUsd: input.minTradeUsd,
        maxTradePct: input.config.maxTradePct,
        liquidityCapUsd: decision.liquidity_cap_usd ?? decision.notional_usd,
        totalExposureUsd: usePulseDirectEmptyPortfolioGuards ? 0 : projectedTotalExposureUsd,
        maxTotalExposurePct: usePulseDirectEmptyPortfolioGuards ? 1 : input.config.maxTotalExposurePct,
        eventExposureUsd: eventExposureUsd.get(decision.event_slug) ?? 0,
        maxEventExposurePct: input.config.maxEventExposurePct,
        openPositions: usePulseDirectEmptyPortfolioGuards ? 0 : projectedOpenPositions,
        maxPositions: usePulseDirectEmptyPortfolioGuards ? Number.MAX_SAFE_INTEGER : input.config.maxPositions
      });
      if (!(rawGuardedNotionalUsd > 0)) {
        const belowConfiguredMinTrade = input.minTradeUsd > 0 && decision.notional_usd + 1e-9 < input.minTradeUsd;
        skipped.push({
          action: decision.action,
          marketSlug: decision.market_slug,
          tokenId: decision.token_id,
          reason: belowConfiguredMinTrade
            ? `blocked_by_strategy_min_trade: Kelly-sized order is ${formatUsd(roundNotional(decision.notional_usd))}, below internal minimum ${formatUsd(input.minTradeUsd)}`
            : "blocked_by_risk_cap: total exposure, event exposure, max positions, bankroll cap, liquidity cap, or minimum trade size reduced the maximum executable notional to zero"
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
            ? `blocked_by_risk_cap: internal risk limits cap this order at ${formatUsd(plannedNotionalUsd)}, but ${openExecutionFloorLabel || "the executable minimum"} is ${formatUsd(exchangeMinNotionalUsd ?? 0)} so the Polymarket order would fail`
            : `blocked_by_exchange_min: Kelly-sized order ${formatUsd(plannedNotionalUsd)} is below Polymarket minimum order size (${book.minOrderSize} shares @ ${formatUsd(book.bestAsk)} ask => ${formatUsd(exchangeMinNotionalUsd ?? 0)} minimum)`
        });
        continue;
      }

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
        exchangeMinNotionalUsd
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
      exchangeMinNotionalUsd: null
    });
  }

  return { plans, skipped };
}
