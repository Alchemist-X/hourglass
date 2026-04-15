/**
 * AVE + Polymarket Combined Runtime.
 *
 * This runtime merges the best of both worlds:
 *   1. Fetch Polymarket prediction markets (original market-pulse pipeline)
 *   2. Enrich candidates with AVE on-chain signals (new enrichment layer)
 *   3. Run AI decision engine with enriched context
 *   4. Apply risk guards
 *   5. Execute on Polymarket (original CLOB executor)
 *
 * The key innovation: using on-chain data from AVE Claw to gain an
 * informational edge in prediction markets. Most Polymarket participants
 * only look at news and sentiment. Hourglass also looks at whale
 * movements, token price anomalies, contract risk, and real-time
 * on-chain activity -- providing quantitative signals that others miss.
 */

import type { AveClient, MockAveClient } from "@autopoly/ave-monitor";
import type { Artifact, TradeDecisionSet } from "@autopoly/contracts";
import type { OrchestratorConfig } from "../config.js";
import { buildArtifactRelativePath, writeStoredArtifact } from "../lib/artifacts.js";
import { reviewCurrentPositions } from "../review/position-review.js";
import type {
  AgentRuntime,
  RuntimeExecutionContext,
  RuntimeExecutionResult,
} from "./agent-runtime.js";
import { composePulseDirectDecisions } from "./decision-composer.js";
import { buildPulseEntryPlans } from "./pulse-entry-planner.js";
import {
  enrichWithAveSignals,
  summarizeEnrichment,
  type AveEnrichmentClient,
  type EnrichedPulseCandidate,
} from "../pulse/ave-signal-enrichment.js";
import { matchCryptoMarkets, type MatchedMarket } from "../pulse/ave-market-matcher.js";
import { generateCryptoSignals, type CryptoSignal } from "../pulse/ave-crypto-signals.js";
import { buildProbabilityEstimate, type ProbabilityEstimate } from "../pulse/ave-signal-to-probability.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvePolymarketRuntimeConfig {
  /** AVE API client for on-chain signal enrichment */
  aveClient?: AveEnrichmentClient;
  /** AVE API client for focused BTC/ETH crypto signal generation */
  cryptoSignalClient?: AveClient | MockAveClient;
  /** Chains to query for AVE data */
  aveChains?: string[];
  /** Max tokens to search per candidate */
  maxTokensPerCandidate?: number;
  /** Minimum absolute edge required to proceed with a crypto market (default: 0.02) */
  minEdge?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars
    ? text
    : `${text.slice(0, maxChars - 24)}\n\n... truncated ...\n`;
}

function summarizeReviewActions(
  results: RuntimeExecutionResult["positionReviews"] = []
) {
  return results.reduce(
    (counts, review) => {
      counts[review.action] += 1;
      return counts;
    },
    { hold: 0, reduce: 0, close: 0 }
  );
}

function buildFallbackSkipDecision(
  context: RuntimeExecutionContext
): TradeDecisionSet["decisions"][number] | null {
  const candidate = context.pulse.candidates[0];
  if (!candidate) {
    return null;
  }
  return {
    action: "skip",
    event_slug: candidate.eventSlug,
    market_slug: candidate.marketSlug,
    token_id: candidate.clobTokenIds[0] ?? candidate.marketSlug,
    side: "BUY",
    notional_usd: 0.01,
    order_type: "FOK",
    ai_prob: candidate.outcomePrices[0] ?? 0.5,
    market_prob: candidate.outcomePrices[0] ?? 0.5,
    edge: 0,
    confidence: "low",
    thesis_md:
      "AVE+Polymarket combined runtime could not produce any executable decisions from the current pulse set and AVE enrichment.",
    sources: [
      {
        title: "Polymarket pulse + AVE signals",
        url: candidate.url,
        retrieved_at_utc: context.pulse.generatedAtUtc,
      },
    ],
    stop_loss_pct: 0,
    resolution_track_required: false,
  };
}

async function buildRuntimeLogArtifact(input: {
  config: OrchestratorConfig;
  context: RuntimeExecutionContext;
  decisions: TradeDecisionSet["decisions"];
  reviewCount: number;
  entryCount: number;
  skippedEntryCount: number;
  enrichmentSummary: {
    totalCandidates: number;
    cryptoRelated: number;
    withSignals: number;
    withRiskAssessment: number;
    withAnomalies: number;
    totalSignals: number;
  };
  focusedPipeline?: {
    matchedMarkets: number;
    cryptoSignals: number;
    estimatesWithEdge: number;
    minEdge: number;
  };
}): Promise<Artifact> {
  const publishedAtUtc = new Date().toISOString();
  const relativePath = buildArtifactRelativePath({
    kind: "runtime-log",
    publishedAtUtc,
    runtime: "ave-polymarket",
    mode: input.context.mode,
    runId: input.context.runId,
    extension: "md",
  });

  const focusedSection = input.focusedPipeline
    ? [
        "",
        "## Focused BTC/ETH Pipeline",
        "",
        `- Matched BTC/ETH price-target markets: ${input.focusedPipeline.matchedMarkets}`,
        `- Crypto signals generated: ${input.focusedPipeline.cryptoSignals}`,
        `- Markets with sufficient edge (>= ${input.focusedPipeline.minEdge}): ${input.focusedPipeline.estimatesWithEdge}`,
      ]
    : [];

  const content = truncate(
    [
      "# AVE + Polymarket Combined Runtime Log",
      "",
      "## Pipeline",
      "",
      "1. Fetch Polymarket prediction markets (original market-pulse)",
      "1b. Focused BTC/ETH pipeline (market match + AVE signals + probability + edge)",
      "2. Enrich candidates with AVE on-chain signals",
      "3. Run AI decision with enriched context",
      "4. Review existing positions",
      "5. Compose decisions (merge reviews + entries)",
      "6. Apply portfolio risk guards",
      "",
      "## AVE Enrichment Summary",
      "",
      `- Total candidates: ${input.enrichmentSummary.totalCandidates}`,
      `- Crypto-related markets: ${input.enrichmentSummary.cryptoRelated}`,
      `- Markets with AVE signals: ${input.enrichmentSummary.withSignals}`,
      `- Markets with risk assessment: ${input.enrichmentSummary.withRiskAssessment}`,
      `- Markets with anomalies: ${input.enrichmentSummary.withAnomalies}`,
      `- Total AVE signals generated: ${input.enrichmentSummary.totalSignals}`,
      ...focusedSection,
      "",
      "## Decision Statistics",
      "",
      `- Pulse title: ${input.context.pulse.title}`,
      `- Pulse candidates: ${input.context.pulse.selectedCandidates}`,
      `- Current positions: ${input.context.positions.length}`,
      `- Position reviews: ${input.reviewCount}`,
      `- New entry plans: ${input.entryCount}`,
      `- Skipped entries (dedup): ${input.skippedEntryCount}`,
      `- Final decisions: ${input.decisions.length}`,
      "",
      "## Final Decisions",
      "",
      "```json",
      JSON.stringify(input.decisions, null, 2),
      "```",
    ].join("\n"),
    input.config.pulse.maxMarkdownChars
  );

  await writeStoredArtifact(
    input.config.artifactStorageRoot,
    relativePath,
    content
  );

  return {
    kind: "runtime-log",
    title: `AVE+Polymarket runtime log ${publishedAtUtc}`,
    path: relativePath,
    content,
    published_at_utc: publishedAtUtc,
  };
}

// ---------------------------------------------------------------------------
// Runtime class
// ---------------------------------------------------------------------------

/**
 * Combined AVE + Polymarket runtime.
 *
 * Extends the original Polymarket pulse-direct pipeline with AVE Claw
 * on-chain signal enrichment. The enriched candidates give the AI
 * decision engine additional context (price movements, whale activity,
 * contract risks) that most prediction market participants overlook.
 */
export class AvePolymarketRuntime implements AgentRuntime {
  readonly name = "ave-polymarket-runtime";

  constructor(
    private readonly config: OrchestratorConfig,
    private readonly aveConfig?: AvePolymarketRuntimeConfig
  ) {}

  async run(context: RuntimeExecutionContext): Promise<RuntimeExecutionResult> {
    // --- Step 1: AVE Signal Enrichment ---
    // Enrich Polymarket candidates with on-chain data from AVE
    let enrichedCandidates: EnrichedPulseCandidate[];
    let enrichmentSummary: ReturnType<typeof summarizeEnrichment>;

    if (this.aveConfig?.aveClient) {
      enrichedCandidates = await enrichWithAveSignals(
        context.pulse.candidates,
        this.aveConfig.aveClient,
        {
          chains: this.aveConfig.aveChains,
          maxTokensPerCandidate: this.aveConfig.maxTokensPerCandidate,
        }
      );
      enrichmentSummary = summarizeEnrichment(enrichedCandidates);
    } else {
      // No AVE client configured -- fall back to unenriched pipeline
      enrichedCandidates = context.pulse.candidates.map((c) => ({
        ...c,
        aveSignals: [],
      }));
      enrichmentSummary = {
        totalCandidates: context.pulse.candidates.length,
        cryptoRelated: 0,
        withSignals: 0,
        withRiskAssessment: 0,
        withAnomalies: 0,
        totalSignals: 0,
      };
    }

    // --- Step 1b: Focused BTC/ETH Pipeline ---
    // Filter candidates to BTC/ETH price-target markets, generate
    // crypto signals via AVE, and compute probability edge.
    const minEdge = this.aveConfig?.minEdge ?? 0.02;
    const matchedCryptoMarkets = matchCryptoMarkets(context.pulse.candidates);
    let focusedEstimates: ProbabilityEstimate[] = [];
    let cryptoSignals: CryptoSignal[] = [];
    const focusedMarketSlugs = new Set<string>();

    if (matchedCryptoMarkets.length > 0 && this.aveConfig?.cryptoSignalClient) {
      console.log(
        `[ave-polymarket] Focused pipeline: matched ${matchedCryptoMarkets.length} BTC/ETH price-target market(s)`
      );
      for (const m of matchedCryptoMarkets) {
        console.log(
          `[ave-polymarket]   - ${m.token} ${m.targetDirection} $${m.targetPrice} (${m.daysToResolution}d) :: ${m.candidate.question}`
        );
      }

      // Generate crypto signals from AVE (BTC + ETH)
      const uniqueTokens = [
        ...new Set(matchedCryptoMarkets.map((m) => m.token)),
      ];
      cryptoSignals = await generateCryptoSignals(
        this.aveConfig.cryptoSignalClient,
        uniqueTokens
      );

      for (const sig of cryptoSignals) {
        console.log(
          `[ave-polymarket]   AVE signal ${sig.token}: trend=${sig.trendScore.toFixed(3)} whale=${sig.whalePressure.toFixed(3)} sentiment=${sig.sentimentScore.toFixed(3)} overall=${sig.overallScore.toFixed(4)} price=$${sig.price.toFixed(2)}`
        );
      }

      // Build a signal lookup by token
      const signalByToken = new Map<string, CryptoSignal>();
      for (const sig of cryptoSignals) {
        signalByToken.set(sig.token, sig);
      }

      // Calculate edge for each matched market
      for (const matched of matchedCryptoMarkets) {
        const signal = signalByToken.get(matched.token);
        if (!signal) continue;

        const marketImpliedProb = matched.candidate.outcomePrices[0] ?? 0.5;

        const estimate = buildProbabilityEstimate({
          marketQuestion: matched.candidate.question,
          token: matched.token,
          currentPrice: signal.price,
          targetPrice: matched.targetPrice,
          targetDirection: matched.targetDirection,
          aveScore: signal.overallScore,
          daysToResolution: matched.daysToResolution,
          marketImpliedProbability: marketImpliedProb,
          isRangeMarket: matched.isRangeMarket,
          rangeLower: matched.rangeLower,
          rangeUpper: matched.rangeUpper,
        });

        console.log(
          `[ave-polymarket]   Edge for "${matched.candidate.question}": est=${estimate.estimatedProbability.toFixed(3)} mkt=${estimate.marketImpliedProbability.toFixed(3)} edge=${estimate.edge >= 0 ? "+" : ""}${estimate.edge.toFixed(4)} conf=${estimate.confidence.toFixed(3)}`
        );

        // Only keep markets with sufficient edge
        if (Math.abs(estimate.edge) >= minEdge) {
          focusedEstimates.push(estimate);
          focusedMarketSlugs.add(matched.candidate.marketSlug);
        }
      }

      console.log(
        `[ave-polymarket] Focused pipeline: ${focusedEstimates.length}/${matchedCryptoMarkets.length} markets pass |edge| >= ${minEdge} threshold`
      );
    } else if (matchedCryptoMarkets.length === 0) {
      console.log(
        "[ave-polymarket] Focused pipeline: no BTC/ETH price-target markets found, using original enrichment path"
      );
    }

    // --- Step 2: Build enriched context ---
    // Inject AVE signal summaries into the pulse context so the
    // decision engine can use them. The enrichment data is appended
    // to each candidate's question as additional context.
    // For focused-pipeline markets, also append the probability estimate.
    const enrichedContext: RuntimeExecutionContext = {
      ...context,
      pulse: {
        ...context.pulse,
        candidates: enrichedCandidates.map((ec) => {
          // Check if this candidate was enhanced by the focused pipeline
          const focusedEstimate = focusedEstimates.find(
            (est) => est.marketQuestion === ec.question
          );
          let questionText = ec.question;

          // Append focused pipeline estimate if available
          if (focusedEstimate) {
            questionText = `${questionText} [AVE FOCUSED: ${focusedEstimate.token} score=${focusedEstimate.aveScore.toFixed(3)} est_prob=${focusedEstimate.estimatedProbability.toFixed(3)} edge=${focusedEstimate.edge >= 0 ? "+" : ""}${focusedEstimate.edge.toFixed(4)} conf=${focusedEstimate.confidence.toFixed(3)}]`;
          }

          // Append original enrichment signals if available
          if (ec.aveSignals.length > 0) {
            const signalSummary = ec.aveSignals
              .map((s) => `[AVE ${s.type}] ${s.description}`)
              .join(" | ");
            const anomalySummary =
              ec.aveAnomalies && ec.aveAnomalies.length > 0
                ? ` | ANOMALIES: ${ec.aveAnomalies.join("; ")}`
                : "";
            questionText = `${questionText} [AVE ON-CHAIN: ${signalSummary}${anomalySummary}]`;
          }

          return questionText !== ec.question
            ? { ...ec, question: questionText }
            : ec;
        }),
      },
    };

    // --- Step 3: Entry planning (uses enriched candidates) ---
    const entryPlans = buildPulseEntryPlans({
      context: enrichedContext,
      positionStopLossPct: this.config.positionStopLossPct,
    });

    // --- Step 4: Position reviews ---
    const positionReviews = reviewCurrentPositions({
      context: enrichedContext,
      entryPlans,
    });

    // --- Step 5: Compose decisions ---
    const composition = composePulseDirectDecisions({
      reviewResults: positionReviews,
      entryPlans,
    });

    const reviewActionCounts = summarizeReviewActions(positionReviews);

    const decisions =
      composition.decisions.length > 0
        ? composition.decisions
        : (() => {
            const fallback = buildFallbackSkipDecision(context);
            return fallback ? [fallback] : [];
          })();

    // --- Step 6: Build artifacts ---
    const runtimeLogArtifact = await buildRuntimeLogArtifact({
      config: this.config,
      context,
      decisions,
      reviewCount: positionReviews.length,
      entryCount: entryPlans.length,
      skippedEntryCount: composition.skippedEntries.length,
      enrichmentSummary,
      focusedPipeline:
        matchedCryptoMarkets.length > 0
          ? {
              matchedMarkets: matchedCryptoMarkets.length,
              cryptoSignals: cryptoSignals.length,
              estimatesWithEdge: focusedEstimates.length,
              minEdge,
            }
          : undefined,
    });

    const pulseArtifact: Artifact = {
      kind: "pulse-report",
      title: context.pulse.title,
      path: context.pulse.relativeMarkdownPath,
      content: context.pulse.markdown,
      published_at_utc: context.pulse.generatedAtUtc,
    };

    return {
      decisionSet: {
        run_id: context.runId,
        runtime: this.name,
        generated_at_utc: new Date().toISOString(),
        bankroll_usd: context.overview.total_equity_usd,
        mode: context.mode,
        decisions,
        artifacts: [pulseArtifact, runtimeLogArtifact],
      },
      promptSummary: [
        "AVE+Polymarket combined runtime:",
        `enriched ${enrichmentSummary.totalCandidates} Polymarket candidates with ${enrichmentSummary.totalSignals} AVE on-chain signals`,
        `(${enrichmentSummary.cryptoRelated} crypto-related, ${enrichmentSummary.withAnomalies} with anomalies).`,
        matchedCryptoMarkets.length > 0
          ? `Focused BTC/ETH pipeline: ${matchedCryptoMarkets.length} matched, ${focusedEstimates.length} with edge >= ${minEdge}.`
          : "Focused BTC/ETH pipeline: no crypto price-target markets found.",
        "Used Position Review + Pulse Entry Planner + Decision Composer",
        "with AVE signal context for improved probability estimation.",
      ].join(" "),
      reasoningMd: [
        "Decision strategy: ave-polymarket (combined pipeline)",
        "Structure: AVE Enrichment + Focused BTC/ETH Pipeline + Position Review + Pulse Entry Planner + Decision Composer",
        `Pulse tradeable: ${context.pulse.tradeable ? "yes" : "no"}`,
        `AVE enrichment: ${enrichmentSummary.totalSignals} signals from ${enrichmentSummary.cryptoRelated} crypto-related markets`,
        `AVE anomalies detected: ${enrichmentSummary.withAnomalies}`,
        `AVE risk assessments: ${enrichmentSummary.withRiskAssessment}`,
        `Focused pipeline: ${matchedCryptoMarkets.length} BTC/ETH markets matched, ${cryptoSignals.length} crypto signals generated, ${focusedEstimates.length} markets with |edge| >= ${minEdge}`,
        `Position reviews: ${positionReviews.length}`,
        `Review actions: hold ${reviewActionCounts.hold} / reduce ${reviewActionCounts.reduce} / close ${reviewActionCounts.close}`,
        `Pulse entry plans: ${entryPlans.length}`,
        `Skipped entries (dedup): ${composition.skippedEntries.length}`,
        `Final decisions: ${decisions.length}`,
      ].join("\n"),
      logsMd: JSON.stringify(
        {
          enrichmentSummary,
          focusedPipeline: {
            matchedMarkets: matchedCryptoMarkets.length,
            cryptoSignals: cryptoSignals.map((s) => ({
              token: s.token,
              price: s.price,
              trendScore: s.trendScore,
              whalePressure: s.whalePressure,
              sentimentScore: s.sentimentScore,
              overallScore: s.overallScore,
            })),
            estimates: focusedEstimates.map((e) => ({
              token: e.token,
              targetPrice: e.targetPrice,
              direction: e.targetDirection,
              estimatedProb: e.estimatedProbability,
              marketProb: e.marketImpliedProbability,
              edge: e.edge,
              confidence: e.confidence,
            })),
          },
          positionReviews,
          entryPlans,
          skippedEntries: composition.skippedEntries,
          decisions,
        },
        null,
        2
      ),
      positionReviews,
      entryPlans,
    };
  }
}
