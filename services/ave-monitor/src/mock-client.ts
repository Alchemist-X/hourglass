/**
 * Mock AVE API client that returns realistic fake data.
 *
 * Drop-in replacement for `AveClient` — implements the same public interface
 * but generates data from a static token pool with slight random variation
 * each call, so the system can run a full demo without a real AVE API key.
 */

import { AveClient } from "./client.js";
import type {
  AveToken,
  AveTokenDetail,
  AveTokenPrice,
  AveTrendingToken,
  AveTransaction,
  AveContractRisk,
  AveChain,
  AveKline,
  AveRankedToken,
} from "./types.js";

import {
  createRng,
  TOKEN_POOL,
  SUPPORTED_CHAINS,
  RANK_TOPICS,
  filterTokens,
  findTokenByAddress,
  findTokensByChain,
  seedToAveToken,
  seedToAveTokenDetail,
  seedToAveTokenPrice,
  seedToAveTrendingToken,
  seedToAveRankedToken,
  seedToContractRisk,
  generateTransactions,
  generateKlines,
  jitterPrice,
  type MockTokenSeed,
} from "./mock-data.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface MockAveClientConfig {
  readonly volatility?: number;
  readonly seed?: number;
}

// ---------------------------------------------------------------------------
// Mock client
// ---------------------------------------------------------------------------

/**
 * A mock implementation of `AveClient` that returns realistic data from a
 * static token pool. Prices drift slightly with each call to simulate live
 * market activity.
 *
 * Usage:
 * ```ts
 * const client = new MockAveClient({ volatility: 0.005, seed: 42 });
 * const tokens = await client.searchTokens({ keyword: "ETH" });
 * ```
 */
export class MockAveClient extends AveClient {
  private readonly volatility: number;
  private callCounter: number;
  private readonly baseSeed: number;

  constructor(config?: MockAveClientConfig) {
    // Pass a dummy API key so the parent constructor is satisfied
    super({ apiKey: "mock-api-key-not-used" });
    this.volatility = config?.volatility ?? 0.005;
    this.baseSeed = config?.seed ?? 42;
    this.callCounter = 0;
  }

  /** Create a per-call RNG so that each invocation produces slightly different values. */
  private rng(): () => number {
    this.callCounter += 1;
    return createRng(this.baseSeed + this.callCounter);
  }

  // -------------------------------------------------------------------------
  // Monitoring Skills
  // -------------------------------------------------------------------------

  override async searchTokens(params: {
    keyword?: string;
    chain?: string;
    limit?: number;
    orderby?: string;
  }): Promise<AveToken[]> {
    const rng = this.rng();
    const seeds = filterTokens(params.keyword, params.chain);
    const limit = params.limit ?? 20;
    const selected = seeds.slice(0, limit);

    const tokens = selected.map((seed) =>
      seedToAveToken(seed, rng, this.volatility)
    );

    if (params.orderby === "volume_24h") {
      tokens.sort((a, b) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0));
    }

    return tokens;
  }

  override async getTokenDetail(tokenId: string): Promise<AveTokenDetail> {
    const rng = this.rng();
    const address = tokenId.includes("-") ? tokenId.split("-")[0]! : tokenId;
    const seed = findTokenByAddress(address) ?? TOKEN_POOL[0]!;
    return seedToAveTokenDetail(seed, rng, this.volatility);
  }

  override async getTokenPrices(tokenIds: string[]): Promise<AveTokenPrice[]> {
    const rng = this.rng();
    return tokenIds
      .map((id) => {
        const address = id.includes("-") ? id.split("-")[0]! : id;
        const seed = findTokenByAddress(address);
        if (!seed) return null;
        return seedToAveTokenPrice(seed, rng, this.volatility);
      })
      .filter((p): p is AveTokenPrice => p !== null);
  }

  override async getTrendingTokens(chain: string): Promise<AveTrendingToken[]> {
    const rng = this.rng();
    const chainTokens = findTokensByChain(chain);
    const pool: readonly MockTokenSeed[] =
      chainTokens.length > 0 ? chainTokens : TOKEN_POOL.slice(0, 10);

    // Sort by absolute price change to simulate "trending"
    const sorted = [...pool].sort(
      (a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h)
    );

    return sorted.map((seed, index) =>
      seedToAveTrendingToken(seed, index + 1, rng, this.volatility)
    );
  }

  override async getTransactions(
    pairId: string,
    params?: { limit?: number; from_time?: number; to_time?: number }
  ): Promise<AveTransaction[]> {
    const rng = this.rng();
    const count = params?.limit ?? 30;

    // Try to find a token to base transactions on. Fall back to ETH.
    const seed = TOKEN_POOL.find(
      (t) => t.address.toLowerCase() === pairId.toLowerCase()
    ) ?? TOKEN_POOL[0]!;

    return generateTransactions(
      seed.address,
      seed.symbol,
      seed.chain,
      seed.price,
      rng,
      Math.min(Math.max(count, 20), 50)
    );
  }

  override async getContractSecurity(
    tokenId: string
  ): Promise<AveContractRisk> {
    const rng = this.rng();
    const address = tokenId.includes("-") ? tokenId.split("-")[0]! : tokenId;
    const seed = findTokenByAddress(address) ?? TOKEN_POOL[0]!;
    return seedToContractRisk(seed, rng);
  }

  override async getSupportedChains(): Promise<AveChain[]> {
    return [...SUPPORTED_CHAINS];
  }

  // -------------------------------------------------------------------------
  // Trading Skills
  // -------------------------------------------------------------------------

  override async getKlines(
    tokenId: string,
    params?: { interval?: number; limit?: number }
  ): Promise<AveKline[]> {
    const rng = this.rng();
    const address = tokenId.includes("-") ? tokenId.split("-")[0]! : tokenId;
    const seed = findTokenByAddress(address) ?? TOKEN_POOL[0]!;

    const count = params?.limit ?? 100;
    const intervalMs = (params?.interval ?? 3600) * 1000;

    // Pick a trend based on the token's 24h change
    const trend: "up" | "down" | "sideways" =
      seed.priceChange24h > 0.02
        ? "up"
        : seed.priceChange24h < -0.02
          ? "down"
          : "sideways";

    return generateKlines(
      seed.price,
      count,
      intervalMs,
      trend,
      rng,
      this.volatility * 4,
      seed.volume24h / 24
    );
  }

  override async getPairKlines(
    pairId: string,
    params?: { interval?: number; limit?: number }
  ): Promise<AveKline[]> {
    // Delegate to getKlines with the same parameters
    return this.getKlines(pairId, params);
  }

  override async getRankTopics(): Promise<string[]> {
    return [...RANK_TOPICS];
  }

  override async getRankings(
    topic: string,
    limit?: number
  ): Promise<AveRankedToken[]> {
    const rng = this.rng();
    const maxResults = limit ?? 20;

    // Filter tokens that belong to the given topic
    const topicTokens = TOKEN_POOL.filter((t) =>
      t.topics.some((tp) => tp.toLowerCase() === topic.toLowerCase())
    );

    // If no tokens match the topic, return top tokens by market cap
    const pool =
      topicTokens.length > 0
        ? topicTokens
        : [...TOKEN_POOL].sort((a, b) => b.marketCap - a.marketCap);

    const selected = pool.slice(0, maxResults);
    return selected.map((seed, index) =>
      seedToAveRankedToken(seed, index + 1, topic, rng, this.volatility)
    );
  }

  override async getMainTokens(chain: string): Promise<AveToken[]> {
    const rng = this.rng();
    const chainTokens = findTokensByChain(chain);

    // If no tokens on this chain, return the top tokens overall
    const pool =
      chainTokens.length > 0
        ? chainTokens
        : [...TOKEN_POOL].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

    return [...pool]
      .sort((a, b) => b.marketCap - a.marketCap)
      .map((seed) => seedToAveToken(seed, rng, this.volatility));
  }
}
