import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildPersistedPolymarketActiveMarketLimit,
  buildPersistedPolymarketOrderLimit,
  persistPolymarketActiveMarketLimits,
  persistPolymarketOrderLimit
} from "./orderbook-limits.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(async (dirPath) => {
    await rm(dirPath, { recursive: true, force: true });
  }));
});

describe("orderbook limits cache", () => {
  it("builds a persisted record from a book snapshot", () => {
    expect(buildPersistedPolymarketOrderLimit("token-1", {
      bestBid: 0.41,
      bestAsk: 0.43,
      minOrderSize: 5,
      tickSize: 0.01,
      lastTradePrice: 0.42
    }, "2026-03-24T00:00:00.000Z")).toEqual({
      tokenId: "token-1",
      updatedAt: "2026-03-24T00:00:00.000Z",
      bestBid: 0.41,
      bestAsk: 0.43,
      minOrderSize: 5,
      tickSize: 0.01,
      lastTradePrice: 0.42,
      minBuyNotionalUsd: 2.15
    });
  });

  it("builds a persisted market limit record from gamma market data", () => {
    expect(buildPersistedPolymarketActiveMarketLimit({
      id: "market-1",
      slug: "demo-market",
      question: "Demo market?",
      orderMinSize: 5,
      orderPriceMinTickSize: 0.001,
      outcomes: "[\"Yes\",\"No\"]",
      clobTokenIds: "[\"token-yes\",\"token-no\"]",
      liquidityNum: 1234.56,
      active: true,
      closed: false,
      enableOrderBook: true,
      updatedAt: "2026-03-24T00:00:00.000Z"
    }, "2026-03-24T00:05:00.000Z")).toEqual({
      marketId: "market-1",
      slug: "demo-market",
      question: "Demo market?",
      orderMinSize: 5,
      orderPriceMinTickSize: 0.001,
      clobTokenIds: ["token-yes", "token-no"],
      outcomes: ["Yes", "No"],
      liquidityUsd: 1234.56,
      active: true,
      closed: false,
      enableOrderBook: true,
      sourceUpdatedAt: "2026-03-24T00:00:00.000Z",
      capturedAt: "2026-03-24T00:05:00.000Z"
    });
  });

  it("persists and merges multiple token limit snapshots into one local file", async () => {
    const dirPath = await mkdtemp(path.join(tmpdir(), "autopoly-order-limits-"));
    tempDirs.push(dirPath);
    const filePath = path.join(dirPath, "polymarket-order-limits.json");

    await persistPolymarketOrderLimit({
      filePath,
      tokenId: "token-1",
      updatedAt: "2026-03-24T00:00:00.000Z",
      book: {
        bestBid: 0.41,
        bestAsk: 0.43,
        minOrderSize: 5,
        tickSize: 0.01,
        lastTradePrice: 0.42
      }
    });
    await persistPolymarketOrderLimit({
      filePath,
      tokenId: "token-2",
      updatedAt: "2026-03-24T00:01:00.000Z",
      book: {
        bestBid: 0.62,
        bestAsk: 0.64,
        minOrderSize: 10,
        tickSize: 0.001,
        lastTradePrice: 0.63
      }
    });

    const store = JSON.parse(await readFile(filePath, "utf8")) as {
      updatedAt: string;
      books: Record<string, unknown>;
    };

    expect(store.updatedAt).toBe("2026-03-24T00:01:00.000Z");
    expect(store.books["token-1"]).toMatchObject({
      tokenId: "token-1",
      minOrderSize: 5,
      tickSize: 0.01,
      minBuyNotionalUsd: 2.15
    });
    expect(store.books["token-2"]).toMatchObject({
      tokenId: "token-2",
      minOrderSize: 10,
      tickSize: 0.001,
      minBuyNotionalUsd: 6.4
    });
  });

  it("stores active market order limits alongside observed books", async () => {
    const dirPath = await mkdtemp(path.join(tmpdir(), "autopoly-order-limits-"));
    tempDirs.push(dirPath);
    const filePath = path.join(dirPath, "polymarket-order-limits.json");

    await persistPolymarketOrderLimit({
      filePath,
      tokenId: "token-1",
      updatedAt: "2026-03-24T00:00:00.000Z",
      book: {
        bestBid: 0.41,
        bestAsk: 0.43,
        minOrderSize: 5,
        tickSize: 0.01,
        lastTradePrice: 0.42
      }
    });
    await persistPolymarketActiveMarketLimits({
      filePath,
      updatedAt: "2026-03-24T00:02:00.000Z",
      markets: [
        buildPersistedPolymarketActiveMarketLimit({
          id: "market-1",
          slug: "demo-market",
          question: "Demo market?",
          orderMinSize: 5,
          orderPriceMinTickSize: 0.001,
          outcomes: "[\"Yes\",\"No\"]",
          clobTokenIds: "[\"token-yes\",\"token-no\"]",
          liquidityNum: 1234.56,
          active: true,
          closed: false,
          enableOrderBook: true,
          updatedAt: "2026-03-24T00:01:30.000Z"
        }, "2026-03-24T00:02:00.000Z")
      ]
    });

    const store = JSON.parse(await readFile(filePath, "utf8")) as {
      updatedAt: string;
      books: Record<string, unknown>;
      activeMarkets: {
        updatedAt: string;
        markets: Record<string, unknown>;
      };
    };

    expect(store.updatedAt).toBe("2026-03-24T00:02:00.000Z");
    expect(store.books["token-1"]).toMatchObject({
      tokenId: "token-1",
      minBuyNotionalUsd: 2.15
    });
    expect(store.activeMarkets.updatedAt).toBe("2026-03-24T00:02:00.000Z");
    expect(store.activeMarkets.markets["market-1"]).toMatchObject({
      marketId: "market-1",
      slug: "demo-market",
      orderMinSize: 5,
      orderPriceMinTickSize: 0.001
    });
  });
});
