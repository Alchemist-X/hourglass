import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkOnChainTokenBalance, validateSellBalance } from "./polymarket-sdk.js";

const mockFetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkOnChainTokenBalance", () => {
  const owner = "0x6664e32f79aee42639f73633e40b5a842b07614e";
  const tokenId = "81697486240392901899167649997008736380137911909662773455994395620863894931973";

  it("returns balance from RPC eth_call response", async () => {
    // 55.744856 shares = 55744856 raw (6 decimals) = 0x352A758 hex
    // padded to 32 bytes
    const hexBalance = "0x" + BigInt(55744856).toString(16).padStart(64, "0");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: hexBalance })
    } as Response);

    const balance = await checkOnChainTokenBalance(owner, tokenId);
    expect(balance).toBeCloseTo(55.744856, 4);
  });

  it("returns null when RPC returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, error: { message: "execution reverted" } })
    } as Response);

    const balance = await checkOnChainTokenBalance(owner, tokenId);
    expect(balance).toBeNull();
  });

  it("returns null when RPC is unreachable", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));

    const balance = await checkOnChainTokenBalance(owner, tokenId);
    expect(balance).toBeNull();
  });

  it("returns 0 when balance is zero", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x" + "0".repeat(64) })
    } as Response);

    const balance = await checkOnChainTokenBalance(owner, tokenId);
    expect(balance).toBe(0);
  });

  it("returns null for invalid token ID", async () => {
    const balance = await checkOnChainTokenBalance(owner, "not-a-number");
    expect(balance).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends correct ERC1155 balanceOf calldata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x" + "0".repeat(64) })
    } as Response);

    await checkOnChainTokenBalance(owner, tokenId);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0]!;
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.method).toBe("eth_call");
    // balanceOf selector is 0x00fdd58e
    expect(body.params[0].data.startsWith("0x00fdd58e")).toBe(true);
    // CTF contract
    expect(body.params[0].to).toBe("0x4D97DCd97eC945f40cF65F87097ACe5EA0476045");
  });
});

describe("validateSellBalance", () => {
  const owner = "0x6664e32f79aee42639f73633e40b5a842b07614e";
  const tokenId = "81697486240392901899167649997008736380137911909662773455994395620863894931973";

  it("returns ok when balance is sufficient", async () => {
    const hexBalance = "0x" + BigInt(60000000).toString(16).padStart(64, "0"); // 60 shares
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: hexBalance })
    } as Response);

    const result = await validateSellBalance(owner, tokenId, 55.7);
    expect(result.ok).toBe(true);
    expect(result.onChainBalance).toBeCloseTo(60, 0);
    expect(result.shortfall).toBe(0);
  });

  it("returns not ok when balance is insufficient", async () => {
    const hexBalance = "0x" + BigInt(30000000).toString(16).padStart(64, "0"); // 30 shares
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: hexBalance })
    } as Response);

    const result = await validateSellBalance(owner, tokenId, 55.7);
    expect(result.ok).toBe(false);
    expect(result.onChainBalance).toBeCloseTo(30, 0);
    expect(result.shortfall).toBeCloseTo(25.7, 0);
  });

  it("fails open when RPC is unavailable", async () => {
    mockFetch.mockRejectedValueOnce(new Error("timeout"));

    const result = await validateSellBalance(owner, tokenId, 55.7);
    expect(result.ok).toBe(true); // fail-open
    expect(result.onChainBalance).toBeNull();
  });

  it("tolerates minor rounding differences", async () => {
    // On-chain: 55.744 shares, request: 55.75 — difference is 0.006 < 0.01 tolerance
    const hexBalance = "0x" + BigInt(55744000).toString(16).padStart(64, "0");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: hexBalance })
    } as Response);

    const result = await validateSellBalance(owner, tokenId, 55.75);
    expect(result.ok).toBe(true);
  });
});
