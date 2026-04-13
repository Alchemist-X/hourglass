import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared / common sub-schemas
// ---------------------------------------------------------------------------

export const avePaginationSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
});
export type AvePagination = z.infer<typeof avePaginationSchema>;

// ---------------------------------------------------------------------------
// Supported chain
// ---------------------------------------------------------------------------

export const aveChainSchema = z.object({
  chain: z.string(),
  chain_name: z.string(),
  chain_logo: z.string().optional(),
  is_supported: z.boolean().optional(),
});
export type AveChain = z.infer<typeof aveChainSchema>;

export const aveChainsResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.array(aveChainSchema),
});
export type AveChainsResponse = z.infer<typeof aveChainsResponseSchema>;

// ---------------------------------------------------------------------------
// Token search result
// ---------------------------------------------------------------------------

export const aveTokenSchema = z.object({
  token_address: z.string(),
  token_name: z.string(),
  token_symbol: z.string(),
  chain: z.string(),
  decimals: z.number().int().nonnegative().optional(),
  logo: z.string().optional(),
  price: z.number().optional(),
  price_change_24h: z.number().optional(),
  volume_24h: z.number().optional(),
  market_cap: z.number().optional(),
  liquidity: z.number().optional(),
  total_supply: z.number().optional(),
  holder_count: z.number().int().nonnegative().optional(),
  pair_address: z.string().optional(),
  created_at: z.number().optional(),
});
export type AveToken = z.infer<typeof aveTokenSchema>;

export const aveTokenSearchResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.object({
    tokens: z.array(aveTokenSchema),
    total: z.number().int().nonnegative().optional(),
  }),
});
export type AveTokenSearchResponse = z.infer<typeof aveTokenSearchResponseSchema>;

// ---------------------------------------------------------------------------
// Token detail
// ---------------------------------------------------------------------------

export const aveTokenDetailSchema = z.object({
  token_address: z.string(),
  token_name: z.string(),
  token_symbol: z.string(),
  chain: z.string(),
  decimals: z.number().int().nonnegative().optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  price: z.number().optional(),
  price_change_5m: z.number().optional(),
  price_change_1h: z.number().optional(),
  price_change_6h: z.number().optional(),
  price_change_24h: z.number().optional(),
  volume_5m: z.number().optional(),
  volume_1h: z.number().optional(),
  volume_6h: z.number().optional(),
  volume_24h: z.number().optional(),
  market_cap: z.number().optional(),
  fdv: z.number().optional(),
  liquidity: z.number().optional(),
  total_supply: z.number().optional(),
  circulating_supply: z.number().optional(),
  holder_count: z.number().int().nonnegative().optional(),
  pair_address: z.string().optional(),
  pair_count: z.number().int().nonnegative().optional(),
  buy_count_5m: z.number().int().nonnegative().optional(),
  sell_count_5m: z.number().int().nonnegative().optional(),
  buy_count_1h: z.number().int().nonnegative().optional(),
  sell_count_1h: z.number().int().nonnegative().optional(),
  buy_count_6h: z.number().int().nonnegative().optional(),
  sell_count_6h: z.number().int().nonnegative().optional(),
  buy_count_24h: z.number().int().nonnegative().optional(),
  sell_count_24h: z.number().int().nonnegative().optional(),
  created_at: z.number().optional(),
  open_time: z.number().optional(),
});
export type AveTokenDetail = z.infer<typeof aveTokenDetailSchema>;

export const aveTokenDetailResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: aveTokenDetailSchema,
});
export type AveTokenDetailResponse = z.infer<typeof aveTokenDetailResponseSchema>;

// ---------------------------------------------------------------------------
// Token price (batch)
// ---------------------------------------------------------------------------

export const aveTokenPriceSchema = z.object({
  token_address: z.string(),
  chain: z.string().optional(),
  price: z.number(),
  price_change_24h: z.number().optional(),
  updated_at: z.number().optional(),
});
export type AveTokenPrice = z.infer<typeof aveTokenPriceSchema>;

export const aveTokenPriceResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.array(aveTokenPriceSchema),
});
export type AveTokenPriceResponse = z.infer<typeof aveTokenPriceResponseSchema>;

// ---------------------------------------------------------------------------
// Trending token
// ---------------------------------------------------------------------------

export const aveTrendingTokenSchema = z.object({
  token_address: z.string(),
  token_name: z.string(),
  token_symbol: z.string(),
  chain: z.string(),
  logo: z.string().optional(),
  price: z.number().optional(),
  price_change_24h: z.number().optional(),
  volume_24h: z.number().optional(),
  market_cap: z.number().optional(),
  liquidity: z.number().optional(),
  holder_count: z.number().int().nonnegative().optional(),
  rank: z.number().int().nonnegative().optional(),
  trending_score: z.number().optional(),
  pair_address: z.string().optional(),
  created_at: z.number().optional(),
});
export type AveTrendingToken = z.infer<typeof aveTrendingTokenSchema>;

export const aveTrendingTokenResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.array(aveTrendingTokenSchema),
});
export type AveTrendingTokenResponse = z.infer<typeof aveTrendingTokenResponseSchema>;

// ---------------------------------------------------------------------------
// Transaction (swap)
// ---------------------------------------------------------------------------

export const aveTransactionSchema = z.object({
  tx_hash: z.string(),
  block_number: z.number().int().nonnegative().optional(),
  timestamp: z.number(),
  maker: z.string(),
  pair_address: z.string().optional(),
  type: z.string().optional(),
  side: z.enum(["buy", "sell"]).optional(),
  price_usd: z.number().optional(),
  amount_token: z.number().optional(),
  amount_usd: z.number().optional(),
  amount_quote: z.number().optional(),
  token_address: z.string().optional(),
  token_symbol: z.string().optional(),
  quote_address: z.string().optional(),
  quote_symbol: z.string().optional(),
  chain: z.string().optional(),
});
export type AveTransaction = z.infer<typeof aveTransactionSchema>;

export const aveTransactionResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.object({
    transactions: z.array(aveTransactionSchema),
    total: z.number().int().nonnegative().optional(),
  }),
});
export type AveTransactionResponse = z.infer<typeof aveTransactionResponseSchema>;

// ---------------------------------------------------------------------------
// Contract security / risk report
// ---------------------------------------------------------------------------

export const aveContractRiskSchema = z.object({
  token_address: z.string(),
  chain: z.string().optional(),
  is_open_source: z.boolean().optional(),
  is_proxy: z.boolean().optional(),
  is_mintable: z.boolean().optional(),
  can_take_back_ownership: z.boolean().optional(),
  owner_change_balance: z.boolean().optional(),
  hidden_owner: z.boolean().optional(),
  selfdestruct: z.boolean().optional(),
  external_call: z.boolean().optional(),
  is_honeypot: z.boolean().optional(),
  buy_tax: z.number().optional(),
  sell_tax: z.number().optional(),
  cannot_buy: z.boolean().optional(),
  cannot_sell_all: z.boolean().optional(),
  slippage_modifiable: z.boolean().optional(),
  is_blacklisted: z.boolean().optional(),
  is_whitelisted: z.boolean().optional(),
  is_anti_whale: z.boolean().optional(),
  trading_cooldown: z.boolean().optional(),
  transfer_pausable: z.boolean().optional(),
  personal_slippage_modifiable: z.boolean().optional(),
  owner_address: z.string().optional(),
  creator_address: z.string().optional(),
  deployer_address: z.string().optional(),
  holder_count: z.number().int().nonnegative().optional(),
  lp_holder_count: z.number().int().nonnegative().optional(),
  total_supply: z.string().optional(),
  risk_level: z.enum(["low", "medium", "high", "critical"]).optional(),
  risk_score: z.number().optional(),
  risk_items: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
  })).optional(),
});
export type AveContractRisk = z.infer<typeof aveContractRiskSchema>;

export const aveContractRiskResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: aveContractRiskSchema,
});
export type AveContractRiskResponse = z.infer<typeof aveContractRiskResponseSchema>;

// ---------------------------------------------------------------------------
// K-line data point
// ---------------------------------------------------------------------------

export const aveKlineSchema = z.object({
  timestamp: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  volume_usd: z.number().optional(),
});
export type AveKline = z.infer<typeof aveKlineSchema>;

export const aveKlineResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.array(aveKlineSchema),
});
export type AveKlineResponse = z.infer<typeof aveKlineResponseSchema>;

// ---------------------------------------------------------------------------
// Market ranking
// ---------------------------------------------------------------------------

export const aveRankedTokenSchema = z.object({
  token_address: z.string(),
  token_name: z.string(),
  token_symbol: z.string(),
  chain: z.string(),
  logo: z.string().optional(),
  price: z.number().optional(),
  price_change_24h: z.number().optional(),
  volume_24h: z.number().optional(),
  market_cap: z.number().optional(),
  liquidity: z.number().optional(),
  holder_count: z.number().int().nonnegative().optional(),
  rank: z.number().int().nonnegative().optional(),
  score: z.number().optional(),
  pair_address: z.string().optional(),
  topic: z.string().optional(),
});
export type AveRankedToken = z.infer<typeof aveRankedTokenSchema>;

export const aveRankTopicsResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.array(z.string()),
});
export type AveRankTopicsResponse = z.infer<typeof aveRankTopicsResponseSchema>;

export const aveRankingsResponseSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.array(aveRankedTokenSchema),
});
export type AveRankingsResponse = z.infer<typeof aveRankingsResponseSchema>;

// ---------------------------------------------------------------------------
// Generic API envelope (for unknown / fallback responses)
// ---------------------------------------------------------------------------

export const aveApiEnvelopeSchema = z.object({
  status: z.number(),
  msg: z.string().optional(),
  data: z.unknown(),
});
export type AveApiEnvelope = z.infer<typeof aveApiEnvelopeSchema>;
