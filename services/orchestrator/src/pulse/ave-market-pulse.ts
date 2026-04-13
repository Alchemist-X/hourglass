/**
 * AVE Claw market pulse fetcher.
 *
 * Replaces the Polymarket-based `market-pulse.ts` with AVE API data sources.
 * Fetches token data from multiple AVE endpoints (token search, trending,
 * rankings, batch price, contract risk) and transforms it into a pipeline-
 * compatible pulse candidate format.
 *
 * The original `market-pulse.ts` is preserved as reference and is not modified.
 */

import type { OrchestratorConfig } from "../config.js";
import type { PulseCandidate, PulseSnapshot } from "./market-pulse.js";

// ---------------------------------------------------------------------------
// AVE API types (raw response shapes)
// ---------------------------------------------------------------------------

interface AveApiResponse<T> {
  status: number;
  msg: string;
  data_type: number;
  data: T;
}

interface AveRawToken {
  token_address?: string;
  chain?: string;
  token_name?: string;
  token_symbol?: string;
  logo_url?: string;
  price_usd?: number;
  price_change_24h?: number;
  tx_volume_u_24h?: number;
  fdv?: number;
  market_cap?: number;
  main_pair_tvl?: number;
  holder_count?: number;
  main_pair_id?: string;
  created_at?: string;
}

interface AveRawRankToken {
  token_address?: string;
  chain?: string;
  token_name?: string;
  token_symbol?: string;
  price_usd?: number;
  price_change_24h?: number;
  tx_volume_u_24h?: number;
  market_cap?: number;
  main_pair_tvl?: number;
}

interface AveRawPriceEntry {
  token_id?: string;
  price_usd?: number;
  price_change_24h?: number;
  tx_volume_u_24h?: number;
  main_pair_tvl?: number;
}

interface AveRawContractRisk {
  token_id?: string;
  risk_level?: string;
  is_honeypot?: boolean;
  has_mint_function?: boolean;
  owner_can_change_balance?: boolean;
  is_open_source?: boolean;
  buy_tax?: number;
  sell_tax?: number;
  lp_locked?: boolean;
  lp_lock_ratio?: number;
}

// ---------------------------------------------------------------------------
// AVE pulse candidate (pipeline-compatible output)
// ---------------------------------------------------------------------------

export interface AvePulseCandidate {
  /** Token symbol, e.g. "ETH" */
  symbol: string;
  /** Human-readable token name */
  name: string;
  /** Token contract address */
  tokenAddress: string;
  /** Chain name, e.g. "ethereum" */
  chain: string;
  /** Composite token ID used by AVE: `{address}-{chain}` */
  tokenId: string;
  /** Current price in USD */
  priceUsd: number;
  /** 24h price change as a decimal (0.05 = +5%) */
  priceChange24h: number;
  /** 24h trading volume in USD */
  volume24hUsd: number;
  /** Fully diluted valuation */
  fdv: number;
  /** Market capitalization */
  marketCap: number;
  /** Main pair total value locked */
  liquidityUsd: number;
  /** Number of holders */
  holderCount: number;
  /** Main trading pair ID for transaction monitoring */
  mainPairId: string;
  /** Token creation timestamp */
  createdAt: string;
  /** Logo URL */
  logoUrl: string;
  /** Discovery source: "search" | "trending" | "ranking" */
  discoverySource: string;
  /** Contract risk assessment (populated when available) */
  riskAssessment?: AveContractRisk;
}

export interface AveContractRisk {
  riskLevel: string;
  isHoneypot: boolean;
  hasMintFunction: boolean;
  ownerCanChangeBalance: boolean;
  isOpenSource: boolean;
  buyTax: number;
  sellTax: number;
  lpLocked: boolean;
  lpLockRatio: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface AveMarketPulseConfig {
  apiKey: string;
  baseUrl: string;
  chains: string[];
  tokenLimit: number;
  trendingLimit: number;
}

export function resolveAvePulseConfig(orchestrator: OrchestratorConfig): AveMarketPulseConfig {
  return {
    apiKey: orchestrator.ave.apiKey,
    baseUrl: orchestrator.ave.apiBaseUrl,
    chains: orchestrator.ave.monitoringChains,
    tokenLimit: orchestrator.ave.pulseTokenLimit,
    trendingLimit: orchestrator.ave.pulseTrendingLimit,
  };
}

// ---------------------------------------------------------------------------
// HTTP helpers with retry + timeout
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1_000;

interface FetchError {
  stage: string;
  context: string;
  cause: string;
  nextCommands: string[];
}

function buildFetchError(stage: string, context: string, cause: unknown, nextCommands: string[] = []): FetchError {
  const message = cause instanceof Error ? cause.message : String(cause);
  return { stage, context, cause: message, nextCommands };
}

function logFetchError(err: FetchError): void {
  console.error(
    `[ave-pulse] ERROR stage=${err.stage} context=${err.context} cause=${err.cause}` +
    (err.nextCommands.length > 0 ? ` next=[${err.nextCommands.join(", ")}]` : "")
  );
}

async function aveGet<T>(
  baseUrl: string,
  path: string,
  apiKey: string,
  stage: string
): Promise<T | null> {
  const url = `${baseUrl}${path}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-API-KEY": apiKey,
            "Accept": "application/json",
          },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const body = (await response.json()) as AveApiResponse<T>;
        if (body.status !== 1) {
          throw new Error(`AVE API error: ${body.msg}`);
        }
        return body.data;
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        const fetchErr = buildFetchError(
          stage,
          `GET ${path}`,
          err,
          ["verify AVE_API_KEY", "check network connectivity", `retry ${stage}`]
        );
        logFetchError(fetchErr);
        return null;
      }
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  return null;
}

async function avePost<T>(
  baseUrl: string,
  path: string,
  apiKey: string,
  body: unknown,
  stage: string
): Promise<T | null> {
  const url = `${baseUrl}${path}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const responseBody = (await response.json()) as AveApiResponse<T>;
        if (responseBody.status !== 1) {
          throw new Error(`AVE API error: ${responseBody.msg}`);
        }
        return responseBody.data;
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        const fetchErr = buildFetchError(
          stage,
          `POST ${path}`,
          err,
          ["verify AVE_API_KEY", "check request body format", `retry ${stage}`]
        );
        logFetchError(fetchErr);
        return null;
      }
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

async function fetchTokenSearch(
  config: AveMarketPulseConfig
): Promise<AveRawToken[]> {
  const tokens: AveRawToken[] = [];

  // Fetch across all configured chains
  const chainResults = await Promise.allSettled(
    config.chains.map(async (chain) => {
      const data = await aveGet<AveRawToken[]>(
        config.baseUrl,
        `/v2/tokens?keyword=&chain=${chain}&limit=${config.tokenLimit}&orderby=tx_volume_u_24h`,
        config.apiKey,
        `token-search-${chain}`
      );
      return data ?? [];
    })
  );

  for (const result of chainResults) {
    if (result.status === "fulfilled") {
      tokens.push(...result.value);
    }
  }

  return tokens;
}

async function fetchTrendingTokens(
  config: AveMarketPulseConfig
): Promise<AveRawToken[]> {
  const tokens: AveRawToken[] = [];

  const chainResults = await Promise.allSettled(
    config.chains.map(async (chain) => {
      const data = await aveGet<AveRawToken[]>(
        config.baseUrl,
        `/v2/tokens/trending?chain=${chain}`,
        config.apiKey,
        `trending-${chain}`
      );
      return data ?? [];
    })
  );

  for (const result of chainResults) {
    if (result.status === "fulfilled") {
      tokens.push(...result.value);
    }
  }

  return tokens;
}

async function fetchHotRankings(
  config: AveMarketPulseConfig
): Promise<AveRawRankToken[]> {
  const data = await aveGet<AveRawRankToken[]>(
    config.baseUrl,
    `/v2/ranks?topic=Hot&limit=${config.trendingLimit}`,
    config.apiKey,
    "hot-rankings"
  );
  return data ?? [];
}

async function fetchBatchPrices(
  config: AveMarketPulseConfig,
  tokenIds: string[]
): Promise<Map<string, AveRawPriceEntry>> {
  const priceMap = new Map<string, AveRawPriceEntry>();
  if (tokenIds.length === 0) return priceMap;

  // AVE supports up to 200 tokens per batch request
  const BATCH_SIZE = 200;
  const batches: string[][] = [];
  for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
    batches.push(tokenIds.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await Promise.allSettled(
    batches.map(async (batch, index) => {
      const data = await avePost<AveRawPriceEntry[]>(
        config.baseUrl,
        "/v2/tokens/price",
        config.apiKey,
        { token_ids: batch, tvl_min: 0, tx_24h_volume_min: 0 },
        `batch-price-${index}`
      );
      return data ?? [];
    })
  );

  for (const result of batchResults) {
    if (result.status === "fulfilled") {
      for (const entry of result.value) {
        if (entry.token_id) {
          priceMap.set(entry.token_id, entry);
        }
      }
    }
  }

  return priceMap;
}

async function fetchContractRisk(
  config: AveMarketPulseConfig,
  tokenId: string
): Promise<AveRawContractRisk | null> {
  return aveGet<AveRawContractRisk>(
    config.baseUrl,
    `/v2/contracts/${tokenId}`,
    config.apiKey,
    `contract-risk-${tokenId}`
  );
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

function buildTokenId(address: string, chain: string): string {
  return `${address}-${chain}`;
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function transformRawToken(
  raw: AveRawToken,
  source: string
): AvePulseCandidate | null {
  const address = safeString(raw.token_address);
  const chain = safeString(raw.chain);
  if (!address || !chain) return null;

  return {
    symbol: safeString(raw.token_symbol, "UNKNOWN"),
    name: safeString(raw.token_name, "Unknown Token"),
    tokenAddress: address,
    chain,
    tokenId: buildTokenId(address, chain),
    priceUsd: safeNumber(raw.price_usd),
    priceChange24h: safeNumber(raw.price_change_24h),
    volume24hUsd: safeNumber(raw.tx_volume_u_24h),
    fdv: safeNumber(raw.fdv),
    marketCap: safeNumber(raw.market_cap),
    liquidityUsd: safeNumber(raw.main_pair_tvl),
    holderCount: safeNumber(raw.holder_count),
    mainPairId: safeString(raw.main_pair_id),
    createdAt: safeString(raw.created_at),
    logoUrl: safeString(raw.logo_url),
    discoverySource: source,
  };
}

function transformRankToken(
  raw: AveRawRankToken,
  source: string
): AvePulseCandidate | null {
  const address = safeString(raw.token_address);
  const chain = safeString(raw.chain);
  if (!address || !chain) return null;

  return {
    symbol: safeString(raw.token_symbol, "UNKNOWN"),
    name: safeString(raw.token_name, "Unknown Token"),
    tokenAddress: address,
    chain,
    tokenId: buildTokenId(address, chain),
    priceUsd: safeNumber(raw.price_usd),
    priceChange24h: safeNumber(raw.price_change_24h),
    volume24hUsd: safeNumber(raw.tx_volume_u_24h),
    fdv: 0,
    marketCap: safeNumber(raw.market_cap),
    liquidityUsd: safeNumber(raw.main_pair_tvl),
    holderCount: 0,
    mainPairId: "",
    createdAt: "",
    logoUrl: "",
    discoverySource: source,
  };
}

function transformContractRisk(raw: AveRawContractRisk): AveContractRisk {
  return {
    riskLevel: safeString(raw.risk_level, "unknown"),
    isHoneypot: raw.is_honeypot === true,
    hasMintFunction: raw.has_mint_function === true,
    ownerCanChangeBalance: raw.owner_can_change_balance === true,
    isOpenSource: raw.is_open_source === true,
    buyTax: safeNumber(raw.buy_tax),
    sellTax: safeNumber(raw.sell_tax),
    lpLocked: raw.lp_locked === true,
    lpLockRatio: safeNumber(raw.lp_lock_ratio),
  };
}

function enrichWithPriceData(
  candidate: AvePulseCandidate,
  priceEntry: AveRawPriceEntry | undefined
): AvePulseCandidate {
  if (!priceEntry) return candidate;

  return {
    ...candidate,
    priceUsd: safeNumber(priceEntry.price_usd, candidate.priceUsd),
    priceChange24h: safeNumber(priceEntry.price_change_24h, candidate.priceChange24h),
    volume24hUsd: safeNumber(priceEntry.tx_volume_u_24h, candidate.volume24hUsd),
    liquidityUsd: safeNumber(priceEntry.main_pair_tvl, candidate.liquidityUsd),
  };
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function deduplicateCandidates(
  candidates: readonly AvePulseCandidate[]
): AvePulseCandidate[] {
  const seen = new Map<string, AvePulseCandidate>();

  for (const candidate of candidates) {
    const existing = seen.get(candidate.tokenId);
    // Keep the entry with the higher volume (more reliable data)
    if (!existing || candidate.volume24hUsd > existing.volume24hUsd) {
      seen.set(candidate.tokenId, candidate);
    }
  }

  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function fetchAveMarkets(config: {
  apiKey: string;
  baseUrl?: string;
  chains?: string[];
  tokenLimit?: number;
  trendingLimit?: number;
}): Promise<AvePulseCandidate[]> {
  const resolvedConfig: AveMarketPulseConfig = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl ?? "https://openapi.avedata.org/api/v1",
    chains: config.chains ?? ["ethereum", "bsc", "polygon", "base", "solana"],
    tokenLimit: config.tokenLimit ?? 300,
    trendingLimit: config.trendingLimit ?? 50,
  };

  if (!resolvedConfig.apiKey) {
    throw new Error("AVE_API_KEY is required but not configured");
  }

  // Phase 1: Fetch from all sources in parallel (graceful degradation)
  const [searchTokens, trendingTokens, hotRankings] = await Promise.all([
    fetchTokenSearch(resolvedConfig),
    fetchTrendingTokens(resolvedConfig),
    fetchHotRankings(resolvedConfig),
  ]);

  // Phase 2: Transform raw data into candidates
  const allCandidates: AvePulseCandidate[] = [];

  for (const raw of searchTokens) {
    const candidate = transformRawToken(raw, "search");
    if (candidate) allCandidates.push(candidate);
  }

  for (const raw of trendingTokens) {
    const candidate = transformRawToken(raw, "trending");
    if (candidate) allCandidates.push(candidate);
  }

  for (const raw of hotRankings) {
    const candidate = transformRankToken(raw, "ranking");
    if (candidate) allCandidates.push(candidate);
  }

  // Phase 3: Deduplicate across sources
  const unique = deduplicateCandidates(allCandidates);

  // Phase 4: Enrich with batch price data
  const tokenIds = unique.map((c) => c.tokenId);
  const priceMap = await fetchBatchPrices(resolvedConfig, tokenIds);
  const enriched = unique.map((candidate) =>
    enrichWithPriceData(candidate, priceMap.get(candidate.tokenId))
  );

  // Phase 5: Fetch contract risk for top candidates by volume (limit to 20
  // to avoid excessive API calls)
  const TOP_RISK_CHECK_COUNT = 20;
  const sortedByVolume = [...enriched].sort(
    (a, b) => b.volume24hUsd - a.volume24hUsd
  );
  const topForRisk = sortedByVolume.slice(0, TOP_RISK_CHECK_COUNT);
  const riskResults = await Promise.allSettled(
    topForRisk.map(async (candidate) => {
      const risk = await fetchContractRisk(resolvedConfig, candidate.tokenId);
      return { tokenId: candidate.tokenId, risk };
    })
  );

  const riskMap = new Map<string, AveContractRisk>();
  for (const result of riskResults) {
    if (result.status === "fulfilled" && result.value.risk) {
      riskMap.set(
        result.value.tokenId,
        transformContractRisk(result.value.risk)
      );
    }
  }

  // Attach risk assessments
  const withRisk = enriched.map((candidate) => {
    const risk = riskMap.get(candidate.tokenId);
    if (!risk) return candidate;
    return { ...candidate, riskAssessment: risk };
  });

  return withRisk;
}

// ---------------------------------------------------------------------------
// Pipeline bridge: convert AVE candidates to PulseCandidate shape
// ---------------------------------------------------------------------------

/**
 * Converts an `AvePulseCandidate` into a `PulseCandidate` so that the
 * downstream pipeline (full-pulse archive, reports, risk evaluation) can
 * consume AVE data without modification.
 */
export function aveCandidateToPulseCandidate(
  ave: AvePulseCandidate
): PulseCandidate {
  return {
    question: `${ave.symbol} (${ave.chain}): ${ave.name}`,
    eventSlug: ave.chain,
    marketSlug: ave.tokenId,
    url: `https://ave.ai/token/${ave.tokenId}`,
    liquidityUsd: ave.liquidityUsd,
    volume24hUsd: ave.volume24hUsd,
    outcomes: ["buy", "sell"],
    outcomePrices: [ave.priceUsd, ave.priceUsd],
    clobTokenIds: [ave.tokenId],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    bestBid: ave.priceUsd,
    bestAsk: ave.priceUsd,
    spread: 0,
    categorySlug: ave.chain,
    categoryLabel: ave.chain,
    categorySource: "ave",
    tags: [
      { slug: ave.discoverySource, label: ave.discoverySource },
      { slug: ave.chain, label: ave.chain },
    ],
    negRisk: ave.riskAssessment?.isHoneypot === true,
  };
}
