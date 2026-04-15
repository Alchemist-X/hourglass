import type { ZodType } from "zod";

import {
  type AveToken,
  type AveTokenDetail,
  type AveTokenPrice,
  type AveTrendingToken,
  type AveTransaction,
  type AveContractRisk,
  type AveChain,
  type AveKline,
  type AveRankedToken,
  aveTokenSearchResponseSchema,
  aveTokenDetailResponseSchema,
  aveTokenPriceResponseSchema,
  aveTrendingTokenResponseSchema,
  aveTransactionResponseSchema,
  aveContractRiskResponseSchema,
  aveChainsResponseSchema,
  aveKlineResponseSchema,
  aveRankTopicsResponseSchema,
  aveRankingsResponseSchema,
  aveApiEnvelopeSchema,
} from "./types.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface AveClientConfig {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly timeout?: number;
}

interface ResolvedConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly timeout: number;
}

function resolveConfig(config: AveClientConfig): ResolvedConfig {
  return {
    apiKey: config.apiKey,
    baseUrl: (config.baseUrl ?? "https://prod.ave-api.com/v2").replace(
      /\/+$/,
      ""
    ),
    timeout: config.timeout ?? 30_000,
  };
}

// ---------------------------------------------------------------------------
// Error wrapper
// ---------------------------------------------------------------------------

export class AveClientError extends Error {
  public readonly stage: string;
  public readonly context: Record<string, unknown>;
  public readonly cause: unknown;

  constructor(
    stage: string,
    message: string,
    context: Record<string, unknown> = {},
    cause?: unknown
  ) {
    super(`[AveClient:${stage}] ${message}`);
    this.name = "AveClientError";
    this.stage = stage;
    this.context = context;
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1_000;

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = BACKOFF_BASE_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new AveClientError(
    "retry-exhausted",
    `All ${MAX_RETRIES} attempts failed for ${label}`,
    { label },
    lastError
  );
}

// ---------------------------------------------------------------------------
// Schema validation helper
// ---------------------------------------------------------------------------

function safeParse<T>(
  schema: ZodType<T>,
  data: unknown,
  label: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(
      `[AveClient] Zod validation warning for ${label}:`,
      result.error.message
    );
    return data as T;
  }
  return result.data;
}

/**
 * Normalize both v1 (array) and v2 ({ points: [...] }) kline shapes into
 * a flat AveKline array. Callers treat this as the canonical shape.
 */
function normalizeKlineData(data: unknown): AveKline[] {
  if (Array.isArray(data)) return data as AveKline[];
  if (data && typeof data === "object") {
    const points = (data as { points?: unknown }).points;
    if (Array.isArray(points)) return points as AveKline[];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class AveClient {
  private readonly config: ResolvedConfig;

  constructor(config: AveClientConfig) {
    this.config = resolveConfig(config);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
    body?: unknown
  ): Promise<T> {
    const url = new URL(`${this.config.baseUrl}/${path.replace(/^\/+/, "")}`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const headers: Record<string, string> = {
        "X-API-KEY": this.config.apiKey,
        Accept: "application/json",
      };
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "(unreadable body)");
        throw new AveClientError(
          "http",
          `HTTP ${response.status} from ${method} ${path}`,
          { status: response.status, body: text }
        );
      }

      const json: unknown = await response.json();

      const envelope = aveApiEnvelopeSchema.safeParse(json);
      if (envelope.success && envelope.data.status !== 1 && envelope.data.status !== 200) {
        throw new AveClientError(
          "api",
          `API error status=${envelope.data.status} msg=${envelope.data.msg ?? "(none)"}`,
          { apiStatus: envelope.data.status, apiMsg: envelope.data.msg }
        );
      }

      return json as T;
    } catch (err) {
      if (err instanceof AveClientError) {
        throw err;
      }
      const message =
        err instanceof Error ? err.message : "Unknown fetch error";
      throw new AveClientError(
        "fetch",
        `Request to ${method} ${path} failed: ${message}`,
        { path },
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async get<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<T> {
    return withRetry(path, () =>
      this.request<T>("GET", path, params)
    );
  }

  private async post<T>(
    path: string,
    body: unknown,
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<T> {
    return withRetry(path, () =>
      this.request<T>("POST", path, params, body)
    );
  }

  // -------------------------------------------------------------------------
  // Monitoring Skills (AVE v2 endpoints)
  // -------------------------------------------------------------------------

  async searchTokens(params: {
    keyword?: string;
    chain?: string;
    limit?: number;
    orderby?: string;
  }): Promise<AveToken[]> {
    const raw = await this.get<unknown>("tokens", {
      keyword: params.keyword,
      chain: params.chain,
      limit: params.limit,
      orderby: params.orderby,
    });
    const parsed = safeParse(aveTokenSearchResponseSchema, raw, "searchTokens");
    return parsed.data.tokens;
  }

  async getTokenDetail(tokenId: string): Promise<AveTokenDetail> {
    const raw = await this.get<unknown>(`tokens/${tokenId}`);
    const parsed = safeParse(
      aveTokenDetailResponseSchema,
      raw,
      "getTokenDetail"
    );
    return parsed.data;
  }

  /**
   * Batch price query. V2 requires POST /tokens/price with a JSON body of
   * { token_ids: [...] }. Token IDs follow the "{address}-{chain}" format
   * where chain uses AVE's short naming ("eth", "bsc", "solana", ...).
   */
  async getTokenPrices(tokenIds: string[]): Promise<AveTokenPrice[]> {
    const raw = await this.post<unknown>("tokens/price", {
      token_ids: tokenIds,
      tvl_min: 0,
      tx_24h_volume_min: 0,
    });
    const parsed = safeParse(
      aveTokenPriceResponseSchema,
      raw,
      "getTokenPrices"
    );
    // V2 returns an object keyed by token_id; v1 returned an array. Normalize.
    const data = parsed.data as unknown;
    if (Array.isArray(data)) return data as AveTokenPrice[];
    if (data && typeof data === "object") {
      return Object.entries(data as Record<string, AveTokenPrice>).map(
        ([token_id, entry]) => ({ token_id, ...entry })
      );
    }
    return [];
  }

  async getTrendingTokens(chain: string): Promise<AveTrendingToken[]> {
    const raw = await this.get<unknown>("tokens/trending", { chain });
    const parsed = safeParse(
      aveTrendingTokenResponseSchema,
      raw,
      "getTrendingTokens"
    );
    return parsed.data;
  }

  async getTransactions(
    pairId: string,
    params?: { limit?: number; from_time?: number; to_time?: number }
  ): Promise<AveTransaction[]> {
    const raw = await this.get<unknown>(`txs/${pairId}`, {
      limit: params?.limit,
      from_time: params?.from_time,
      to_time: params?.to_time,
    });
    const parsed = safeParse(
      aveTransactionResponseSchema,
      raw,
      "getTransactions"
    );
    return parsed.data.transactions;
  }

  async getContractSecurity(tokenId: string): Promise<AveContractRisk> {
    const raw = await this.get<unknown>(`contracts/${tokenId}`);
    const parsed = safeParse(
      aveContractRiskResponseSchema,
      raw,
      "getContractSecurity"
    );
    return parsed.data;
  }

  async getSupportedChains(): Promise<AveChain[]> {
    const raw = await this.get<unknown>("supported_chains");
    const parsed = safeParse(aveChainsResponseSchema, raw, "getSupportedChains");
    return parsed.data;
  }

  // -------------------------------------------------------------------------
  // Trading Skills
  // -------------------------------------------------------------------------

  async getKlines(
    tokenId: string,
    params?: { interval?: number; limit?: number }
  ): Promise<AveKline[]> {
    const raw = await this.get<unknown>(`klines/token/${tokenId}`, {
      interval: params?.interval,
      limit: params?.limit,
    });
    const parsed = safeParse(aveKlineResponseSchema, raw, "getKlines");
    return normalizeKlineData(parsed.data);
  }

  async getPairKlines(
    pairId: string,
    params?: { interval?: number; limit?: number }
  ): Promise<AveKline[]> {
    const raw = await this.get<unknown>(`klines/pair/${pairId}`, {
      interval: params?.interval,
      limit: params?.limit,
    });
    const parsed = safeParse(aveKlineResponseSchema, raw, "getPairKlines");
    return normalizeKlineData(parsed.data);
  }

  async getRankTopics(): Promise<string[]> {
    const raw = await this.get<unknown>("ranks/topics");
    const parsed = safeParse(
      aveRankTopicsResponseSchema,
      raw,
      "getRankTopics"
    );
    return parsed.data;
  }

  async getRankings(topic: string, limit?: number): Promise<AveRankedToken[]> {
    const raw = await this.get<unknown>("ranks", { topic, limit });
    const parsed = safeParse(
      aveRankingsResponseSchema,
      raw,
      "getRankings"
    );
    return parsed.data;
  }

  async getMainTokens(chain: string): Promise<AveToken[]> {
    const raw = await this.get<unknown>("tokens/main", { chain });
    const parsed = safeParse(
      aveTokenSearchResponseSchema,
      raw,
      "getMainTokens"
    );
    return parsed.data.tokens;
  }
}
