/**
 * Static token pool and helper functions for the mock AVE client.
 *
 * All data here is deterministic or seed-driven so that demo runs are
 * reproducible while still looking realistic.
 */

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

// ---------------------------------------------------------------------------
// Seeded PRNG (xoshiro128** — fast, deterministic, good distribution)
// ---------------------------------------------------------------------------

export function createRng(seed: number): () => number {
  let s0 = seed | 1;
  let s1 = (seed >>> 1) | 3;
  let s2 = (seed >>> 2) | 5;
  let s3 = (seed >>> 3) | 7;

  return () => {
    const t = s1 << 9;
    let r = s1 * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return (r >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Price simulation helpers
// ---------------------------------------------------------------------------

/**
 * Apply a random walk to a base price. Returns a new price that is
 * within `volatility` percent of the original.
 */
export function jitterPrice(
  base: number,
  rng: () => number,
  volatility: number
): number {
  const delta = (rng() - 0.5) * 2 * volatility;
  return Math.max(0.0000001, base * (1 + delta));
}

/**
 * Generate realistic OHLCV candle data.
 *
 * @param basePrice  Starting price
 * @param count      Number of candles
 * @param intervalMs Candle width in milliseconds
 * @param trend      "up" | "down" | "sideways"
 * @param rng        Seeded random function
 * @param volatility Per-candle volatility (fraction)
 * @param baseVolume Approximate volume per candle in USD
 */
export function generateKlines(
  basePrice: number,
  count: number,
  intervalMs: number,
  trend: "up" | "down" | "sideways",
  rng: () => number,
  volatility: number,
  baseVolume: number
): AveKline[] {
  const drift =
    trend === "up" ? 0.002 : trend === "down" ? -0.002 : 0;

  const now = Date.now();
  let price = basePrice;
  const klines: AveKline[] = [];

  for (let i = 0; i < count; i++) {
    const open = price;
    const move1 = open * (1 + (rng() - 0.5) * volatility);
    const move2 = open * (1 + (rng() - 0.5) * volatility);
    const close = open * (1 + drift + (rng() - 0.5) * volatility);

    const high = Math.max(open, close, move1, move2);
    const low = Math.min(open, close, move1, move2);
    const volume = baseVolume * (0.5 + rng());

    klines.push({
      timestamp: now - (count - i) * intervalMs,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume: round(volume),
      volume_usd: round(volume),
    });

    price = close;
  }

  return klines;
}

function round(v: number, decimals = 6): number {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

// ---------------------------------------------------------------------------
// Fake transaction generator
// ---------------------------------------------------------------------------

const FAKE_MAKERS = [
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "0x28C6c06298d514Db089934071355E5743bf21d60",
  "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
  "0xF977814e90dA44bFA03b6295A0616a897441aceC",
  "0x1681195C176239ac5E72d9aeBaCf5b2492E0C4ee",
  "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
  "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
  "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
];

export function generateTransactions(
  tokenAddress: string,
  tokenSymbol: string,
  chain: string,
  basePrice: number,
  rng: () => number,
  count: number
): AveTransaction[] {
  const now = Date.now();
  const txs: AveTransaction[] = [];

  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? "buy" : "sell";
    const price = jitterPrice(basePrice, rng, 0.003);
    const amountUsd = 50 + rng() * 50_000;
    const amountToken = amountUsd / price;
    const makerIndex = Math.floor(rng() * FAKE_MAKERS.length);

    txs.push({
      tx_hash: `0x${randomHex(rng, 64)}`,
      block_number: 19_000_000 + Math.floor(rng() * 1_000_000),
      timestamp: Math.floor((now - i * 30_000 - rng() * 30_000) / 1000),
      maker: FAKE_MAKERS[makerIndex] ?? FAKE_MAKERS[0]!,
      pair_address: `0x${randomHex(rng, 40)}`,
      type: "swap",
      side: side as "buy" | "sell",
      price_usd: round(price),
      amount_token: round(amountToken, 4),
      amount_usd: round(amountUsd, 2),
      amount_quote: round(amountUsd, 2),
      token_address: tokenAddress,
      token_symbol: tokenSymbol,
      quote_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      quote_symbol: "USDT",
      chain,
    });
  }

  return txs;
}

function randomHex(rng: () => number, length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(rng() * 16)];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Supported chains
// ---------------------------------------------------------------------------

export const SUPPORTED_CHAINS: readonly AveChain[] = [
  { chain: "ethereum", chain_name: "Ethereum", is_supported: true },
  { chain: "bsc", chain_name: "BNB Smart Chain", is_supported: true },
  { chain: "polygon", chain_name: "Polygon", is_supported: true },
  { chain: "base", chain_name: "Base", is_supported: true },
  { chain: "solana", chain_name: "Solana", is_supported: true },
  { chain: "arbitrum", chain_name: "Arbitrum", is_supported: true },
] as const;

// ---------------------------------------------------------------------------
// Rank topics
// ---------------------------------------------------------------------------

export const RANK_TOPICS: readonly string[] = [
  "Hot",
  "Meme",
  "Gainers",
  "Losers",
  "AI",
  "DeFi",
] as const;

// ---------------------------------------------------------------------------
// Static token pool
// ---------------------------------------------------------------------------

export interface MockTokenSeed {
  readonly address: string;
  readonly name: string;
  readonly symbol: string;
  readonly chain: string;
  readonly decimals: number;
  readonly price: number;
  readonly priceChange24h: number;
  readonly volume24h: number;
  readonly marketCap: number;
  readonly liquidity: number;
  readonly totalSupply: number;
  readonly holderCount: number;
  readonly description: string;
  readonly website: string;
  readonly riskLevel: "low" | "medium" | "high" | "critical";
  readonly topics: readonly string[];
}

export const TOKEN_POOL: readonly MockTokenSeed[] = [
  {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    name: "Wrapped Ether",
    symbol: "ETH",
    chain: "ethereum",
    decimals: 18,
    price: 3420.55,
    priceChange24h: 0.021,
    volume24h: 14_800_000_000,
    marketCap: 411_000_000_000,
    liquidity: 2_300_000_000,
    totalSupply: 120_200_000,
    holderCount: 98_000_000,
    description: "The native cryptocurrency of the Ethereum network.",
    website: "https://ethereum.org",
    riskLevel: "low",
    topics: ["Hot", "DeFi"],
  },
  {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    chain: "ethereum",
    decimals: 8,
    price: 97_150.0,
    priceChange24h: 0.013,
    volume24h: 980_000_000,
    marketCap: 1_900_000_000_000,
    liquidity: 890_000_000,
    totalSupply: 154_300,
    holderCount: 65_000,
    description: "Bitcoin wrapped for the Ethereum ecosystem.",
    website: "https://wbtc.network",
    riskLevel: "low",
    topics: ["Hot"],
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    name: "Tether USD",
    symbol: "USDT",
    chain: "ethereum",
    decimals: 6,
    price: 1.0,
    priceChange24h: 0.0001,
    volume24h: 62_000_000_000,
    marketCap: 144_000_000_000,
    liquidity: 5_200_000_000,
    totalSupply: 144_000_000_000,
    holderCount: 5_800_000,
    description: "Fiat-collateralized stablecoin pegged to USD.",
    website: "https://tether.to",
    riskLevel: "low",
    topics: ["Hot", "DeFi"],
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    name: "USD Coin",
    symbol: "USDC",
    chain: "ethereum",
    decimals: 6,
    price: 1.0,
    priceChange24h: -0.0002,
    volume24h: 8_200_000_000,
    marketCap: 52_000_000_000,
    liquidity: 3_100_000_000,
    totalSupply: 52_000_000_000,
    holderCount: 2_100_000,
    description: "Fully-reserved stablecoin by Circle.",
    website: "https://www.circle.com/usdc",
    riskLevel: "low",
    topics: ["Hot", "DeFi"],
  },
  {
    address: "So11111111111111111111111111111111111111112",
    name: "Solana",
    symbol: "SOL",
    chain: "solana",
    decimals: 9,
    price: 178.30,
    priceChange24h: 0.035,
    volume24h: 3_400_000_000,
    marketCap: 86_000_000_000,
    liquidity: 1_500_000_000,
    totalSupply: 580_000_000,
    holderCount: 12_000_000,
    description: "High-performance blockchain for dApps and DeFi.",
    website: "https://solana.com",
    riskLevel: "low",
    topics: ["Hot"],
  },
  {
    address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
    name: "BNB",
    symbol: "BNB",
    chain: "bsc",
    decimals: 18,
    price: 605.20,
    priceChange24h: 0.008,
    volume24h: 1_800_000_000,
    marketCap: 88_000_000_000,
    liquidity: 920_000_000,
    totalSupply: 145_900_000,
    holderCount: 4_200_000,
    description: "Native token of BNB Chain ecosystem.",
    website: "https://www.bnbchain.org",
    riskLevel: "low",
    topics: ["Hot"],
  },
  {
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    name: "Polygon",
    symbol: "MATIC",
    chain: "polygon",
    decimals: 18,
    price: 0.52,
    priceChange24h: -0.018,
    volume24h: 320_000_000,
    marketCap: 5_100_000_000,
    liquidity: 410_000_000,
    totalSupply: 10_000_000_000,
    holderCount: 1_800_000,
    description: "Ethereum scaling platform.",
    website: "https://polygon.technology",
    riskLevel: "low",
    topics: ["Hot", "Losers"],
  },
  {
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    name: "Arbitrum",
    symbol: "ARB",
    chain: "arbitrum",
    decimals: 18,
    price: 0.88,
    priceChange24h: 0.042,
    volume24h: 410_000_000,
    marketCap: 3_400_000_000,
    liquidity: 280_000_000,
    totalSupply: 10_000_000_000,
    holderCount: 820_000,
    description: "Leading Ethereum Layer 2 optimistic rollup.",
    website: "https://arbitrum.io",
    riskLevel: "low",
    topics: ["Hot", "Gainers"],
  },
  {
    address: "0x4200000000000000000000000000000000000042",
    name: "Optimism",
    symbol: "OP",
    chain: "ethereum",
    decimals: 18,
    price: 1.62,
    priceChange24h: 0.029,
    volume24h: 290_000_000,
    marketCap: 2_100_000_000,
    liquidity: 180_000_000,
    totalSupply: 4_294_967_296,
    holderCount: 640_000,
    description: "Ethereum Layer 2 using the OP Stack.",
    website: "https://optimism.io",
    riskLevel: "low",
    topics: ["Hot", "Gainers"],
  },
  {
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    name: "Chainlink",
    symbol: "LINK",
    chain: "ethereum",
    decimals: 18,
    price: 15.85,
    priceChange24h: 0.015,
    volume24h: 620_000_000,
    marketCap: 10_200_000_000,
    liquidity: 520_000_000,
    totalSupply: 1_000_000_000,
    holderCount: 720_000,
    description: "Decentralized oracle network.",
    website: "https://chain.link",
    riskLevel: "low",
    topics: ["Hot", "DeFi", "AI"],
  },
  {
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    name: "Uniswap",
    symbol: "UNI",
    chain: "ethereum",
    decimals: 18,
    price: 7.42,
    priceChange24h: 0.026,
    volume24h: 220_000_000,
    marketCap: 5_600_000_000,
    liquidity: 390_000_000,
    totalSupply: 1_000_000_000,
    holderCount: 410_000,
    description: "Governance token for the Uniswap DEX protocol.",
    website: "https://uniswap.org",
    riskLevel: "low",
    topics: ["DeFi"],
  },
  {
    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    name: "Aave",
    symbol: "AAVE",
    chain: "ethereum",
    decimals: 18,
    price: 218.50,
    priceChange24h: 0.033,
    volume24h: 310_000_000,
    marketCap: 3_300_000_000,
    liquidity: 260_000_000,
    totalSupply: 16_000_000,
    holderCount: 180_000,
    description: "Decentralized non-custodial lending protocol.",
    website: "https://aave.com",
    riskLevel: "low",
    topics: ["DeFi", "Gainers"],
  },
  {
    address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    name: "Maker",
    symbol: "MKR",
    chain: "ethereum",
    decimals: 18,
    price: 1520.0,
    priceChange24h: -0.007,
    volume24h: 98_000_000,
    marketCap: 1_400_000_000,
    liquidity: 120_000_000,
    totalSupply: 977_631,
    holderCount: 95_000,
    description: "Governance token for the MakerDAO protocol.",
    website: "https://makerdao.com",
    riskLevel: "low",
    topics: ["DeFi"],
  },
  {
    address: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    name: "Curve DAO Token",
    symbol: "CRV",
    chain: "ethereum",
    decimals: 18,
    price: 0.58,
    priceChange24h: -0.031,
    volume24h: 145_000_000,
    marketCap: 730_000_000,
    liquidity: 95_000_000,
    totalSupply: 2_030_000_000,
    holderCount: 68_000,
    description: "Governance and utility token for Curve Finance.",
    website: "https://curve.fi",
    riskLevel: "low",
    topics: ["DeFi", "Losers"],
  },
  {
    address: "0x4206904396bB2dA87963d7289e3b7A3E7B50092C",
    name: "Dogecoin",
    symbol: "DOGE",
    chain: "ethereum",
    decimals: 8,
    price: 0.164,
    priceChange24h: 0.052,
    volume24h: 1_200_000_000,
    marketCap: 23_500_000_000,
    liquidity: 410_000_000,
    totalSupply: 143_600_000_000,
    holderCount: 6_700_000,
    description: "The original meme cryptocurrency.",
    website: "https://dogecoin.com",
    riskLevel: "low",
    topics: ["Meme", "Hot", "Gainers"],
  },
  {
    address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    name: "Pepe",
    symbol: "PEPE",
    chain: "ethereum",
    decimals: 18,
    price: 0.0000118,
    priceChange24h: 0.087,
    volume24h: 980_000_000,
    marketCap: 4_900_000_000,
    liquidity: 180_000_000,
    totalSupply: 420_690_000_000_000,
    holderCount: 310_000,
    description: "Meme token inspired by the Pepe the Frog meme.",
    website: "https://www.pepe.vip",
    riskLevel: "medium",
    topics: ["Meme", "Hot", "Gainers"],
  },
  {
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    name: "Shiba Inu",
    symbol: "SHIB",
    chain: "ethereum",
    decimals: 18,
    price: 0.0000225,
    priceChange24h: 0.041,
    volume24h: 620_000_000,
    marketCap: 13_200_000_000,
    liquidity: 250_000_000,
    totalSupply: 589_735_030_000_000,
    holderCount: 1_400_000,
    description: "A decentralized meme token community.",
    website: "https://shibatoken.com",
    riskLevel: "low",
    topics: ["Meme", "Hot"],
  },
  {
    address: "0x163f8C2467924be0ae7B5347228CABF260318753",
    name: "Worldcoin",
    symbol: "WLD",
    chain: "ethereum",
    decimals: 18,
    price: 2.15,
    priceChange24h: -0.022,
    volume24h: 280_000_000,
    marketCap: 1_400_000_000,
    liquidity: 110_000_000,
    totalSupply: 10_000_000_000,
    holderCount: 220_000,
    description: "Digital identity and financial network.",
    website: "https://worldcoin.org",
    riskLevel: "low",
    topics: ["AI", "Losers"],
  },
  {
    address: "0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24",
    name: "Render Token",
    symbol: "RNDR",
    chain: "ethereum",
    decimals: 18,
    price: 7.85,
    priceChange24h: 0.058,
    volume24h: 410_000_000,
    marketCap: 4_100_000_000,
    liquidity: 190_000_000,
    totalSupply: 536_870_912,
    holderCount: 145_000,
    description: "Decentralized GPU rendering network.",
    website: "https://rendertoken.com",
    riskLevel: "low",
    topics: ["AI", "Gainers"],
  },
  {
    address: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85",
    name: "Fetch.ai",
    symbol: "FET",
    chain: "ethereum",
    decimals: 18,
    price: 2.32,
    priceChange24h: 0.045,
    volume24h: 350_000_000,
    marketCap: 6_000_000_000,
    liquidity: 165_000_000,
    totalSupply: 2_630_547_141,
    holderCount: 110_000,
    description: "AI-powered decentralized machine learning platform.",
    website: "https://fetch.ai",
    riskLevel: "low",
    topics: ["AI", "Gainers"],
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function findTokenByAddress(address: string): MockTokenSeed | undefined {
  return TOKEN_POOL.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}

export function findTokenBySymbol(symbol: string): MockTokenSeed | undefined {
  return TOKEN_POOL.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export function findTokensByChain(chain: string): readonly MockTokenSeed[] {
  return TOKEN_POOL.filter(
    (t) => t.chain.toLowerCase() === chain.toLowerCase()
  );
}

export function filterTokens(
  keyword?: string,
  chain?: string
): readonly MockTokenSeed[] {
  let results: readonly MockTokenSeed[] = TOKEN_POOL;

  if (chain) {
    results = results.filter(
      (t) => t.chain.toLowerCase() === chain.toLowerCase()
    );
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    results = results.filter(
      (t) =>
        t.symbol.toLowerCase().includes(kw) ||
        t.name.toLowerCase().includes(kw) ||
        t.address.toLowerCase().includes(kw)
    );
  }

  return results;
}

// ---------------------------------------------------------------------------
// Converters: MockTokenSeed -> AVE types
// ---------------------------------------------------------------------------

export function seedToAveToken(
  seed: MockTokenSeed,
  rng: () => number,
  volatility: number
): AveToken {
  const price = jitterPrice(seed.price, rng, volatility);
  return {
    token_address: seed.address,
    token_name: seed.name,
    token_symbol: seed.symbol,
    chain: seed.chain,
    decimals: seed.decimals,
    logo: `https://assets.ave.ai/tokens/${seed.symbol.toLowerCase()}.png`,
    price,
    price_change_24h: seed.priceChange24h + (rng() - 0.5) * 0.01,
    volume_24h: seed.volume24h * (0.9 + rng() * 0.2),
    market_cap: seed.marketCap,
    liquidity: seed.liquidity,
    total_supply: seed.totalSupply,
    holder_count: seed.holderCount,
    pair_address: `0x${randomHex(rng, 40)}`,
    created_at: Math.floor(Date.now() / 1000) - Math.floor(rng() * 365 * 86400),
  };
}

export function seedToAveTokenDetail(
  seed: MockTokenSeed,
  rng: () => number,
  volatility: number
): AveTokenDetail {
  const price = jitterPrice(seed.price, rng, volatility);
  const baseVolume = seed.volume24h;

  return {
    token_address: seed.address,
    token_name: seed.name,
    token_symbol: seed.symbol,
    chain: seed.chain,
    decimals: seed.decimals,
    logo: `https://assets.ave.ai/tokens/${seed.symbol.toLowerCase()}.png`,
    description: seed.description,
    website: seed.website,
    twitter: `https://twitter.com/${seed.symbol.toLowerCase()}`,
    telegram: `https://t.me/${seed.symbol.toLowerCase()}`,
    price,
    price_change_5m: (rng() - 0.5) * 0.004,
    price_change_1h: (rng() - 0.5) * 0.012,
    price_change_6h: (rng() - 0.5) * 0.03,
    price_change_24h: seed.priceChange24h + (rng() - 0.5) * 0.01,
    volume_5m: baseVolume * 0.003 * (0.8 + rng() * 0.4),
    volume_1h: baseVolume * 0.04 * (0.8 + rng() * 0.4),
    volume_6h: baseVolume * 0.25 * (0.8 + rng() * 0.4),
    volume_24h: baseVolume * (0.9 + rng() * 0.2),
    market_cap: seed.marketCap,
    fdv: seed.marketCap * (1 + rng() * 0.3),
    liquidity: seed.liquidity,
    total_supply: seed.totalSupply,
    circulating_supply: seed.totalSupply * (0.6 + rng() * 0.35),
    holder_count: seed.holderCount,
    pair_address: `0x${randomHex(rng, 40)}`,
    pair_count: 5 + Math.floor(rng() * 50),
    buy_count_5m: Math.floor(rng() * 200),
    sell_count_5m: Math.floor(rng() * 180),
    buy_count_1h: Math.floor(rng() * 2000),
    sell_count_1h: Math.floor(rng() * 1800),
    buy_count_6h: Math.floor(rng() * 12000),
    sell_count_6h: Math.floor(rng() * 11000),
    buy_count_24h: Math.floor(rng() * 48000),
    sell_count_24h: Math.floor(rng() * 45000),
    created_at: Math.floor(Date.now() / 1000) - Math.floor(rng() * 365 * 86400),
  };
}

export function seedToAveTrendingToken(
  seed: MockTokenSeed,
  rank: number,
  rng: () => number,
  volatility: number
): AveTrendingToken {
  const price = jitterPrice(seed.price, rng, volatility);
  return {
    token_address: seed.address,
    token_name: seed.name,
    token_symbol: seed.symbol,
    chain: seed.chain,
    logo: `https://assets.ave.ai/tokens/${seed.symbol.toLowerCase()}.png`,
    price,
    price_change_24h: seed.priceChange24h + (rng() - 0.5) * 0.01,
    volume_24h: seed.volume24h * (0.9 + rng() * 0.2),
    market_cap: seed.marketCap,
    liquidity: seed.liquidity,
    holder_count: seed.holderCount,
    rank,
    trending_score: 100 - rank * 4 + rng() * 10,
    pair_address: `0x${randomHex(rng, 40)}`,
    created_at: Math.floor(Date.now() / 1000) - Math.floor(rng() * 365 * 86400),
  };
}

export function seedToAveTokenPrice(
  seed: MockTokenSeed,
  rng: () => number,
  volatility: number
): AveTokenPrice {
  return {
    token_address: seed.address,
    chain: seed.chain,
    price: jitterPrice(seed.price, rng, volatility),
    price_change_24h: seed.priceChange24h + (rng() - 0.5) * 0.01,
    updated_at: Math.floor(Date.now() / 1000),
  };
}

export function seedToAveRankedToken(
  seed: MockTokenSeed,
  rank: number,
  topic: string,
  rng: () => number,
  volatility: number
): AveRankedToken {
  const price = jitterPrice(seed.price, rng, volatility);
  return {
    token_address: seed.address,
    token_name: seed.name,
    token_symbol: seed.symbol,
    chain: seed.chain,
    logo: `https://assets.ave.ai/tokens/${seed.symbol.toLowerCase()}.png`,
    price,
    price_change_24h: seed.priceChange24h + (rng() - 0.5) * 0.01,
    volume_24h: seed.volume24h * (0.9 + rng() * 0.2),
    market_cap: seed.marketCap,
    liquidity: seed.liquidity,
    holder_count: seed.holderCount,
    rank,
    score: 100 - rank * 3 + rng() * 5,
    pair_address: `0x${randomHex(rng, 40)}`,
    topic,
  };
}

export function seedToContractRisk(
  seed: MockTokenSeed,
  rng: () => number
): AveContractRisk {
  const isSuspicious = seed.riskLevel === "medium" || seed.riskLevel === "high";

  return {
    token_address: seed.address,
    chain: seed.chain,
    is_open_source: !isSuspicious || rng() > 0.3,
    is_proxy: isSuspicious && rng() > 0.5,
    is_mintable: isSuspicious && rng() > 0.6,
    can_take_back_ownership: isSuspicious && rng() > 0.7,
    owner_change_balance: isSuspicious && rng() > 0.8,
    hidden_owner: isSuspicious && rng() > 0.85,
    selfdestruct: false,
    external_call: isSuspicious && rng() > 0.4,
    is_honeypot: seed.riskLevel === "high" || seed.riskLevel === "critical",
    buy_tax: isSuspicious ? rng() * 5 : 0,
    sell_tax: isSuspicious ? rng() * 8 : 0,
    cannot_buy: false,
    cannot_sell_all: isSuspicious && rng() > 0.9,
    slippage_modifiable: isSuspicious && rng() > 0.7,
    is_blacklisted: false,
    is_whitelisted: false,
    is_anti_whale: rng() > 0.7,
    trading_cooldown: false,
    transfer_pausable: isSuspicious && rng() > 0.6,
    owner_address: isSuspicious
      ? `0x${randomHex(rng, 40)}`
      : "0x0000000000000000000000000000000000000000",
    creator_address: `0x${randomHex(rng, 40)}`,
    holder_count: seed.holderCount,
    lp_holder_count: Math.floor(seed.holderCount * 0.01),
    total_supply: String(seed.totalSupply),
    risk_level: seed.riskLevel,
    risk_score:
      seed.riskLevel === "low"
        ? 10 + rng() * 15
        : seed.riskLevel === "medium"
          ? 40 + rng() * 20
          : 70 + rng() * 25,
    risk_items: isSuspicious
      ? [
          {
            name: "Mintable",
            description: "Contract owner can mint additional tokens.",
            severity: "medium" as const,
          },
          {
            name: "External calls",
            description: "Contract makes external calls to unverified addresses.",
            severity: "high" as const,
          },
        ]
      : [],
  };
}
