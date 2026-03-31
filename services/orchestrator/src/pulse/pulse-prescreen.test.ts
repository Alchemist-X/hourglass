import { describe, expect, it } from "vitest";
import type { PulseCandidate } from "./market-pulse.js";
import { buildPreScreenPrompt, parsePreScreenResponse } from "./pulse-prescreen.js";

function makeCandidateStub(overrides: Partial<PulseCandidate> = {}): PulseCandidate {
  return {
    question: "Will Bitcoin exceed $100K by end of 2026?",
    eventSlug: "bitcoin-100k-2026",
    marketSlug: "bitcoin-100k-eoy-2026",
    url: "https://polymarket.com/event/bitcoin-100k",
    liquidityUsd: 250_000,
    volume24hUsd: 80_000,
    outcomes: ["Yes", "No"],
    outcomePrices: [0.42, 0.58],
    clobTokenIds: ["tok-1", "tok-2"],
    endDate: "2026-12-31T00:00:00.000Z",
    bestBid: 0.41,
    bestAsk: 0.43,
    spread: 0.02,
    categorySlug: "crypto",
    categoryLabel: "Crypto",
    categorySource: null,
    tags: [],
    ...overrides
  };
}

const sampleCandidates: PulseCandidate[] = [
  makeCandidateStub({
    question: "Will Bitcoin exceed $100K by end of 2026?",
    marketSlug: "bitcoin-100k-eoy-2026",
    categorySlug: "crypto",
    outcomePrices: [0.42, 0.58],
    liquidityUsd: 250_000,
    endDate: "2026-12-31T00:00:00.000Z"
  }),
  makeCandidateStub({
    question: "Will the US enter a recession in 2026?",
    marketSlug: "us-recession-2026",
    categorySlug: "economics",
    outcomePrices: [0.30, 0.70],
    liquidityUsd: 180_000,
    endDate: "2026-12-31T00:00:00.000Z"
  }),
  makeCandidateStub({
    question: "Will it rain in NYC tomorrow?",
    marketSlug: "nyc-rain-tomorrow",
    categorySlug: "weather",
    outcomePrices: [0.55, 0.45],
    liquidityUsd: 5_200,
    endDate: "2026-04-01T00:00:00.000Z"
  })
];

describe("buildPreScreenPrompt", () => {
  it("includes all candidate questions and slugs", () => {
    const prompt = buildPreScreenPrompt(sampleCandidates);

    expect(prompt).toContain("Will Bitcoin exceed $100K by end of 2026?");
    expect(prompt).toContain("bitcoin-100k-eoy-2026");
    expect(prompt).toContain("Will the US enter a recession in 2026?");
    expect(prompt).toContain("us-recession-2026");
    expect(prompt).toContain("Will it rain in NYC tomorrow?");
    expect(prompt).toContain("nyc-rain-tomorrow");
  });

  it("includes the TRADE/SKIP classification instructions", () => {
    const prompt = buildPreScreenPrompt(sampleCandidates);

    expect(prompt).toContain("TRADE");
    expect(prompt).toContain("SKIP");
    expect(prompt).toContain("one-line reason");
  });

  it("formats candidate lines with numbered entries", () => {
    const prompt = buildPreScreenPrompt(sampleCandidates);

    expect(prompt).toContain("1. Will Bitcoin exceed $100K by end of 2026?");
    expect(prompt).toContain("2. Will the US enter a recession in 2026?");
    expect(prompt).toContain("3. Will it rain in NYC tomorrow?");
  });

  it("includes category, price, end date, and liquidity metadata", () => {
    const prompt = buildPreScreenPrompt(sampleCandidates);

    expect(prompt).toContain("category: crypto");
    expect(prompt).toContain("price: 42%/58%");
    expect(prompt).toContain("ends: 2026-12-31");
    expect(prompt).toContain("$250K");
  });

  it("handles candidates with no category gracefully", () => {
    const candidates = [makeCandidateStub({ categorySlug: null, categoryLabel: null })];
    const prompt = buildPreScreenPrompt(candidates);

    expect(prompt).toContain("category: uncategorized");
  });

  it("formats large liquidity values with M suffix", () => {
    const candidates = [makeCandidateStub({ liquidityUsd: 2_500_000 })];
    const prompt = buildPreScreenPrompt(candidates);

    expect(prompt).toContain("$2.5M");
  });

  it("handles empty candidate list", () => {
    const prompt = buildPreScreenPrompt([]);

    expect(prompt).toContain("Candidates:");
    // No numbered lines
    expect(prompt).not.toMatch(/^\d+\./m);
  });
});

describe("parsePreScreenResponse", () => {
  it("parses a clean TRADE/SKIP response", () => {
    const response = [
      "TRADE|bitcoin-100k-eoy-2026|AI can analyze macro trends and on-chain data",
      "TRADE|us-recession-2026|Economic indicators can inform probability estimates",
      "SKIP|nyc-rain-tomorrow|Weather is random with no AI edge"
    ].join("\n");

    const results = parsePreScreenResponse(response, sampleCandidates);

    expect(results).toHaveLength(3);
    expect(results.find((r) => r.marketSlug === "bitcoin-100k-eoy-2026")).toEqual({
      marketSlug: "bitcoin-100k-eoy-2026",
      suitable: true,
      reason: "AI can analyze macro trends and on-chain data"
    });
    expect(results.find((r) => r.marketSlug === "nyc-rain-tomorrow")).toEqual({
      marketSlug: "nyc-rain-tomorrow",
      suitable: false,
      reason: "Weather is random with no AI edge"
    });
  });

  it("defaults missing candidates to TRADE", () => {
    const response = "SKIP|nyc-rain-tomorrow|too random";
    const results = parsePreScreenResponse(response, sampleCandidates);

    expect(results).toHaveLength(3);
    const bitcoin = results.find((r) => r.marketSlug === "bitcoin-100k-eoy-2026")!;
    expect(bitcoin.suitable).toBe(true);
    expect(bitcoin.reason).toContain("defaulting to TRADE");

    const recession = results.find((r) => r.marketSlug === "us-recession-2026")!;
    expect(recession.suitable).toBe(true);
    expect(recession.reason).toContain("defaulting to TRADE");
  });

  it("ignores lines that do not match TRADE/SKIP format", () => {
    const response = [
      "Here are my classifications:",
      "",
      "TRADE|bitcoin-100k-eoy-2026|good edge",
      "MAYBE|us-recession-2026|uncertain",
      "Some random commentary",
      "SKIP|nyc-rain-tomorrow|no edge"
    ].join("\n");

    const results = parsePreScreenResponse(response, sampleCandidates);

    expect(results).toHaveLength(3);
    const bitcoin = results.find((r) => r.marketSlug === "bitcoin-100k-eoy-2026")!;
    expect(bitcoin.suitable).toBe(true);

    // "MAYBE" line is invalid -> recession defaults to TRADE
    const recession = results.find((r) => r.marketSlug === "us-recession-2026")!;
    expect(recession.suitable).toBe(true);
    expect(recession.reason).toContain("defaulting to TRADE");

    const rain = results.find((r) => r.marketSlug === "nyc-rain-tomorrow")!;
    expect(rain.suitable).toBe(false);
  });

  it("ignores slugs that are not in the candidate list", () => {
    const response = [
      "TRADE|bitcoin-100k-eoy-2026|good",
      "SKIP|unknown-market|irrelevant",
      "TRADE|us-recession-2026|ok",
      "SKIP|nyc-rain-tomorrow|random"
    ].join("\n");

    const results = parsePreScreenResponse(response, sampleCandidates);

    expect(results).toHaveLength(3);
    expect(results.find((r) => r.marketSlug === "unknown-market")).toBeUndefined();
  });

  it("handles duplicate slugs by keeping the first occurrence", () => {
    const response = [
      "TRADE|bitcoin-100k-eoy-2026|good edge",
      "SKIP|bitcoin-100k-eoy-2026|actually skip",
      "TRADE|us-recession-2026|ok",
      "SKIP|nyc-rain-tomorrow|random"
    ].join("\n");

    const results = parsePreScreenResponse(response, sampleCandidates);

    const bitcoin = results.find((r) => r.marketSlug === "bitcoin-100k-eoy-2026")!;
    expect(bitcoin.suitable).toBe(true);
    expect(bitcoin.reason).toBe("good edge");
  });

  it("handles empty response gracefully", () => {
    const results = parsePreScreenResponse("", sampleCandidates);

    expect(results).toHaveLength(3);
    // All default to TRADE
    for (const result of results) {
      expect(result.suitable).toBe(true);
      expect(result.reason).toContain("defaulting to TRADE");
    }
  });

  it("is case-insensitive for the verdict", () => {
    const response = [
      "trade|bitcoin-100k-eoy-2026|good",
      "skip|us-recession-2026|no edge",
      "Trade|nyc-rain-tomorrow|maybe"
    ].join("\n");

    const results = parsePreScreenResponse(response, sampleCandidates);

    expect(results.find((r) => r.marketSlug === "bitcoin-100k-eoy-2026")!.suitable).toBe(true);
    expect(results.find((r) => r.marketSlug === "us-recession-2026")!.suitable).toBe(false);
    expect(results.find((r) => r.marketSlug === "nyc-rain-tomorrow")!.suitable).toBe(true);
  });

  it("handles reasons with pipe characters", () => {
    const response = "TRADE|bitcoin-100k-eoy-2026|good|multiple|reasons here";

    const results = parsePreScreenResponse(response, sampleCandidates);

    const bitcoin = results.find((r) => r.marketSlug === "bitcoin-100k-eoy-2026")!;
    expect(bitcoin.suitable).toBe(true);
    expect(bitcoin.reason).toBe("good|multiple|reasons here");
  });

  it("assigns default reason when reason part is empty", () => {
    const response = "TRADE|bitcoin-100k-eoy-2026|";

    const results = parsePreScreenResponse(response, sampleCandidates);

    const bitcoin = results.find((r) => r.marketSlug === "bitcoin-100k-eoy-2026")!;
    expect(bitcoin.reason).toBe("no reason given");
  });

  it("handles whitespace around pipe delimiters", () => {
    const response = "  TRADE | bitcoin-100k-eoy-2026 | has good macro indicators  ";

    const results = parsePreScreenResponse(response, sampleCandidates);

    const bitcoin = results.find((r) => r.marketSlug === "bitcoin-100k-eoy-2026")!;
    expect(bitcoin.suitable).toBe(true);
    expect(bitcoin.reason).toBe("has good macro indicators");
  });
});
