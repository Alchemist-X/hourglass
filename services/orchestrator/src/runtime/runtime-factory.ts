import type { OrchestratorConfig } from "../config.js";
import type { AgentRuntime } from "./agent-runtime.js";
import { PulseDirectRuntime } from "./pulse-direct-runtime.js";
import { ProviderRuntime } from "./provider-runtime.js";
import { AvePolymarketRuntime } from "./ave-polymarket-runtime.js";
import { AveClient } from "@autopoly/ave-monitor";
import { adaptAveClient } from "../pulse/ave-signal-enrichment.js";

export function createAgentRuntime(config: OrchestratorConfig): AgentRuntime {
  if (config.decisionStrategy === "pulse-direct") {
    // When an AVE API key is configured, upgrade to the AVE+Polymarket
    // combined runtime for on-chain signal enrichment.
    if (config.ave.apiKey) {
      const aveClient = new AveClient({
        apiKey: config.ave.apiKey,
        baseUrl: config.ave.apiBaseUrl,
      });
      return new AvePolymarketRuntime(config, {
        aveClient: adaptAveClient(aveClient),
        aveChains: config.ave.monitoringChains,
        maxTokensPerCandidate: config.ave.pulseTokenLimit,
      });
    }
    return new PulseDirectRuntime(config);
  }
  if (config.runtimeProvider === "none") {
    throw new Error(
      "AGENT_DECISION_STRATEGY=provider-runtime requires AGENT_RUNTIME_PROVIDER to be set to a valid provider (e.g. codex, openclaw). " +
      "The default provider is \"none\", which only works with the pulse-direct strategy."
    );
  }
  process.emitWarning(
    "AGENT_DECISION_STRATEGY=provider-runtime is now treated as a legacy path. Prefer pulse-direct for the main daily pulse flow.",
    {
      code: "AUTOPOLY_LEGACY_PROVIDER_RUNTIME"
    }
  );
  return new ProviderRuntime(config, config.runtimeProvider);
}
