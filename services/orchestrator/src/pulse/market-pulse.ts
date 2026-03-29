import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import type { RunMode } from "@autopoly/contracts";
import type { AgentRuntimeProvider, OrchestratorConfig, SkillLocale } from "../config.js";
import { buildArtifactRelativePath } from "../lib/artifacts.js";
import type { ProgressReporter } from "../lib/terminal-progress.js";
import { buildFullPulseArchive } from "./full-pulse.js";

interface RawPulseMarket {
  question: string;
  event_slug: string;
  slug: string;
  url: string;
  liquidity: number;
  volume_24hr: number;
  outcomes: string[];
  outcome_prices: number[];
  clob_token_ids: string[];
  end_date: string;
  best_bid: number;
  best_ask: number;
  spread: number;
  category_slug?: string | null;
  category_label?: string | null;
  category_source?: string | null;
  tags?: Array<{
    slug?: string | null;
    label?: string | null;
  }>;
}

interface RawPulseBucketStat {
  slug: string;
  label: string;
  count: number;
  source?: string | null;
}

interface RawPulseStatsBundle {
  fetched?: RawPulseBucketStat[];
  filtered?: RawPulseBucketStat[];
}

interface RawPulseFetchConfig {
  pages_per_dimension?: number;
  events_per_page?: number;
  min_fetched_markets?: number;
  dimensions?: string[];
}

interface RawPulseOutput {
  fetched_at: string;
  total_fetched: number;
  total_filtered: number;
  min_liquidity: number;
  fetch_config?: RawPulseFetchConfig;
  category_stats?: RawPulseStatsBundle;
  tag_stats?: RawPulseStatsBundle;
  markets: RawPulseMarket[];
}

export interface PulseTag {
  slug: string;
  label: string;
}

export interface PulseBucketStat {
  slug: string;
  label: string;
  count: number;
  source?: string;
}

export interface PulseStatsBundle {
  fetched: PulseBucketStat[];
  filtered: PulseBucketStat[];
}

export interface PulseFetchConfig {
  pagesPerDimension: number;
  eventsPerPage: number;
  minFetchedMarkets: number;
  dimensions: string[];
}

export interface PulseCandidate {
  question: string;
  eventSlug: string;
  marketSlug: string;
  url: string;
  liquidityUsd: number;
  volume24hUsd: number;
  outcomes: string[];
  outcomePrices: number[];
  clobTokenIds: string[];
  endDate: string;
  bestBid: number;
  bestAsk: number;
  spread: number;
  categorySlug?: string | null;
  categoryLabel?: string | null;
  categorySource?: string | null;
  tags?: PulseTag[];
}

export interface PulseSnapshot {
  id: string;
  generatedAtUtc: string;
  title: string;
  relativeMarkdownPath: string;
  absoluteMarkdownPath: string;
  relativeJsonPath: string;
  absoluteJsonPath: string;
  markdown: string;
  totalFetched: number;
  totalFiltered: number;
  selectedCandidates: number;
  minLiquidityUsd: number;
  fetchConfig?: PulseFetchConfig;
  categoryStats?: PulseStatsBundle;
  tagStats?: PulseStatsBundle;
  candidates: PulseCandidate[];
  riskFlags: string[];
  tradeable: boolean;
}

function isChineseLocale(locale: SkillLocale): boolean {
  return locale === "zh";
}

function toPulseTag(tag: NonNullable<RawPulseMarket["tags"]>[number]): PulseTag | null {
  const slug = typeof tag?.slug === "string" ? tag.slug.trim() : "";
  const label = typeof tag?.label === "string" ? tag.label.trim() : "";
  if (!slug && !label) {
    return null;
  }
  return {
    slug: slug || label.toLowerCase().replace(/\s+/g, "-"),
    label: label || slug
  };
}

function toPulseStatsBundle(value: RawPulseStatsBundle | undefined): PulseStatsBundle {
  const normalize = (rows: RawPulseBucketStat[] | undefined) =>
    Array.isArray(rows)
      ? rows
          .filter((row) =>
            typeof row?.slug === "string" &&
            row.slug.trim() &&
            typeof row?.label === "string" &&
            row.label.trim() &&
            typeof row?.count === "number" &&
            Number.isFinite(row.count)
          )
          .map((row) => ({
            slug: row.slug.trim(),
            label: row.label.trim(),
            count: Number(row.count),
            ...(typeof row.source === "string" && row.source.trim() ? { source: row.source.trim() } : {})
          }))
      : [];

  return {
    fetched: normalize(value?.fetched),
    filtered: normalize(value?.filtered)
  };
}

function toPulseFetchConfig(raw: RawPulseOutput, config: OrchestratorConfig): PulseFetchConfig {
  const dimensions = Array.isArray(raw.fetch_config?.dimensions)
    ? raw.fetch_config?.dimensions.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  return {
    pagesPerDimension: Number(raw.fetch_config?.pages_per_dimension ?? config.pulse.pages),
    eventsPerPage: Number(raw.fetch_config?.events_per_page ?? config.pulse.eventsPerPage),
    minFetchedMarkets: Number(raw.fetch_config?.min_fetched_markets ?? config.pulse.minFetchedMarkets),
    dimensions: dimensions.length > 0 ? dimensions : ["volume24hr", "liquidity", "startDate", "competitive"]
  };
}

function toPulseCandidate(market: RawPulseMarket): PulseCandidate {
  return {
    question: market.question,
    eventSlug: market.event_slug,
    marketSlug: market.slug,
    url: market.url,
    liquidityUsd: Number(market.liquidity),
    volume24hUsd: Number(market.volume_24hr),
    outcomes: Array.isArray(market.outcomes) ? market.outcomes : [],
    outcomePrices: Array.isArray(market.outcome_prices) ? market.outcome_prices.map((value) => Number(value)) : [],
    clobTokenIds: Array.isArray(market.clob_token_ids) ? market.clob_token_ids.map((value) => String(value)) : [],
    endDate: market.end_date,
    bestBid: Number(market.best_bid ?? 0),
    bestAsk: Number(market.best_ask ?? 0),
    spread: Number(market.spread ?? 0),
    categorySlug: typeof market.category_slug === "string" && market.category_slug.trim() ? market.category_slug.trim() : null,
    categoryLabel: typeof market.category_label === "string" && market.category_label.trim() ? market.category_label.trim() : null,
    categorySource: typeof market.category_source === "string" && market.category_source.trim() ? market.category_source.trim() : null,
    tags: Array.isArray(market.tags)
      ? market.tags
          .map((tag) => toPulseTag(tag))
          .filter((tag): tag is PulseTag => tag != null)
      : []
  };
}

function resolvePulseScriptsDir(config: OrchestratorConfig, locale: SkillLocale): string {
  if (config.pulse.sourceRepo === "polymarket-market-pulse") {
    const repoDir = config.pulse.sourceRepoDir;
    return path.join(repoDir, "scripts");
  }

  return path.join(config.pulse.sourceRepoDir, "polymarket-market-pulse", "scripts");
}

function buildPulseTitle(generatedAtUtc: string, provider: AgentRuntimeProvider, locale: SkillLocale): string {
  const date = new Date(generatedAtUtc);
  const formatted = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
  const time = [
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    "UTC"
  ].join(":").replace(":UTC", " UTC");
  return isChineseLocale(locale)
    ? `市场脉冲 ${formatted} ${time} [${provider}]`
    : `Pulse ${formatted} ${time} [${provider}]`;
}

export function resolvePulseFetchTimeoutMs(config: OrchestratorConfig): number | null {
  if (config.pulseTimeoutMode === "unbounded") {
    return null;
  }
  if (config.pulseFetchTimeoutSeconds <= 0) {
    return null;
  }
  return config.pulseFetchTimeoutSeconds * 1000;
}

export function evaluatePulseRiskFlags(snapshot: {
  generatedAtUtc: string;
  totalFetched?: number;
  candidates: PulseCandidate[];
}, config: OrchestratorConfig, locale: SkillLocale = "en"): string[] {
  const flags: string[] = [];
  const ageMinutes = (Date.now() - new Date(snapshot.generatedAtUtc).getTime()) / 60000;
  const zh = isChineseLocale(locale);

  if (typeof snapshot.totalFetched === "number" && snapshot.totalFetched < config.pulse.minFetchedMarkets) {
    flags.push(
      zh
        ? `抓取到的原始市场数量低于目标（${snapshot.totalFetched}/${config.pulse.minFetchedMarkets}）`
        : `fetched market universe is below target (${snapshot.totalFetched}/${config.pulse.minFetchedMarkets})`
    );
  }

  if (snapshot.candidates.length < config.pulse.minTradeableCandidates) {
    flags.push(
      zh
        ? `可交易候选数量低于阈值（${snapshot.candidates.length}/${config.pulse.minTradeableCandidates}）`
        : `tradeable candidates below minimum threshold (${snapshot.candidates.length}/${config.pulse.minTradeableCandidates})`
    );
  }

  if (ageMinutes > config.pulse.maxAgeMinutes) {
    flags.push(
      zh
        ? `市场脉冲快照已过期（${ageMinutes.toFixed(1)} 分钟 > ${config.pulse.maxAgeMinutes} 分钟）`
        : `pulse snapshot is stale (${ageMinutes.toFixed(1)}m > ${config.pulse.maxAgeMinutes}m)`
    );
  }

  return flags;
}

async function runPulseFetch(
  scriptPath: string,
  config: OrchestratorConfig,
  progress?: ProgressReporter
): Promise<RawPulseOutput> {
  const tempDir = await mkdtemp(path.join(tmpdir(), "autopoly-pulse-"));
  const outputPath = path.join(tempDir, "pulse.json");

  try {
    const args = [
      scriptPath,
      "--pages",
      String(config.pulse.pages),
      "--events-per-page",
      String(config.pulse.eventsPerPage),
      "--min-fetched-markets",
      String(config.pulse.minFetchedMarkets),
      "--min-liquidity",
      String(config.pulse.minLiquidityUsd),
      "--output",
      outputPath
    ];

    await new Promise<void>((resolve, reject) => {
      const child = spawn("python3", args, {
        cwd: path.dirname(scriptPath),
        stdio: ["ignore", "pipe", "pipe"]
      });
      const timeoutMs = resolvePulseFetchTimeoutMs(config);
      const startedAt = Date.now();
      const heartbeat = setInterval(() => {
        progress?.heartbeat({
          percent: 14,
          label: "Pulse fetch in progress",
          detail: path.basename(scriptPath),
          elapsedMs: Date.now() - startedAt,
          timeoutMs: timeoutMs ?? undefined
        });
      }, 10000);

      let stderr = "";
      const timeout = timeoutMs == null
        ? null
        : setTimeout(() => {
            child.kill("SIGTERM");
            reject(new Error(`fetch_markets.py timed out after ${timeoutMs}ms`));
          }, timeoutMs);
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      child.on("error", (error) => {
        clearInterval(heartbeat);
        if (timeout) {
          clearTimeout(timeout);
        }
        reject(error);
      });
      child.on("close", (code) => {
        clearInterval(heartbeat);
        if (timeout) {
          clearTimeout(timeout);
        }
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr || `fetch_markets.py exited with code ${code}`));
      });
    });

    const content = await readFile(outputPath, "utf8");
    return JSON.parse(content) as RawPulseOutput;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function generatePulseSnapshot(input: {
  config: OrchestratorConfig;
  provider: AgentRuntimeProvider;
  locale: SkillLocale;
  runId: string;
  mode: RunMode;
  progress?: ProgressReporter;
}): Promise<PulseSnapshot> {
  const generatedAtUtc = new Date().toISOString();
  const scriptDir = resolvePulseScriptsDir(input.config, input.locale);
  const scriptPath = path.join(scriptDir, "fetch_markets.py");
  input.progress?.stage({
    percent: 10,
    label: "Pulse fetch started",
    detail: `reading market list via ${path.basename(scriptPath)}`
  });
  const raw = await runPulseFetch(scriptPath, input.config, input.progress);
  const fetchConfig = toPulseFetchConfig(raw, input.config);
  const categoryStats = toPulseStatsBundle(raw.category_stats);
  const tagStats = toPulseStatsBundle(raw.tag_stats);
  const candidates = raw.markets
    .map(toPulseCandidate)
    .filter((candidate) => candidate.clobTokenIds.length > 0)
    .slice(0, input.config.pulse.maxCandidates);
  input.progress?.stage({
    percent: 20,
    label: "Pulse market list ready",
    detail: `${raw.total_fetched} fetched | ${raw.total_filtered} filtered | ${candidates.length} selected`
  });
  const baseFlags = evaluatePulseRiskFlags({
    generatedAtUtc,
    totalFetched: raw.total_fetched,
    candidates
  }, input.config, input.locale);
  const title = buildPulseTitle(generatedAtUtc, input.provider, input.locale);
  const relativeMarkdownPath = buildArtifactRelativePath({
    kind: "pulse-report",
    publishedAtUtc: generatedAtUtc,
    runtime: input.provider,
    mode: input.mode,
    runId: input.runId,
    extension: "md"
  });
  const relativeJsonPath = buildArtifactRelativePath({
    kind: "pulse-report",
    publishedAtUtc: generatedAtUtc,
    runtime: input.provider,
    mode: input.mode,
    runId: input.runId,
    extension: "json"
  });

  const archive = await buildFullPulseArchive({
    config: input.config,
    provider: input.provider,
    locale: input.locale,
    title,
    generatedAtUtc,
    totalFetched: raw.total_fetched,
    totalFiltered: raw.total_filtered,
    minLiquidityUsd: raw.min_liquidity,
    fetchConfig,
    categoryStats,
    tagStats,
    candidates,
    riskFlags: baseFlags,
    relativeJsonPath,
    relativeMarkdownPath,
    progress: input.progress
  });
  input.progress?.stage({
    percent: 68,
    label: "Full pulse archive written",
    detail: relativeMarkdownPath
  });

  return {
    id: randomUUID(),
    generatedAtUtc,
    title,
    relativeMarkdownPath,
    absoluteMarkdownPath: archive.absoluteMarkdownPath,
    relativeJsonPath,
    absoluteJsonPath: archive.absoluteJsonPath,
    markdown: archive.markdown,
    totalFetched: raw.total_fetched,
    totalFiltered: raw.total_filtered,
    selectedCandidates: candidates.length,
    minLiquidityUsd: raw.min_liquidity,
    fetchConfig,
    categoryStats,
    tagStats,
    candidates,
    riskFlags: baseFlags,
    tradeable: baseFlags.length === 0
  };
}
