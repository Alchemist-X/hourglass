import { pathToFileURL } from "node:url";
import { createTerminalPrinter } from "@autopoly/terminal-ui";
import {
  resolveDefaultPolymarketOrderLimitPath,
  snapshotPolymarketActiveMarketLimits
} from "../services/executor/src/lib/orderbook-limits.ts";

interface Args {
  pageSize: number;
  maxMarkets: number | null;
}

function parseArgs(argv = process.argv.slice(2)): Args {
  const readNumber = (flag: string) => {
    const index = argv.indexOf(flag);
    const raw = index >= 0 ? argv[index + 1] : undefined;
    const value = raw == null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  return {
    pageSize: readNumber("--page-size") ?? 500,
    maxMarkets: readNumber("--max-markets")
  };
}

async function main() {
  const args = parseArgs();
  const printer = createTerminalPrinter();
  const repoRoot = process.cwd();
  const filePath = resolveDefaultPolymarketOrderLimitPath(repoRoot);
  const startedAt = Date.now();

  printer.section("Polymarket Order Limits", "cache active market limits locally");
  printer.note(
    "info",
    "fetching",
    `${args.maxMarkets == null ? "full active snapshot" : `max ${args.maxMarkets} markets`} | page size ${args.pageSize}`
  );

  const result = await snapshotPolymarketActiveMarketLimits({
    filePath,
    pageSize: args.pageSize,
    maxMarkets: args.maxMarkets
  });

  printer.table([
    ["File", result.filePath],
    ["Markets", String(result.marketCount)],
    ["Token IDs", String(result.tokenCount)],
    ["Elapsed", `${((Date.now() - startedAt) / 1000).toFixed(1)}s`]
  ]);
  printer.note("success", "Local Polymarket limits cache updated", result.filePath);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main();
}
