import type { OrchestratorConfig } from "../config.js";
import type { AgentRuntime } from "./agent-runtime.js";
import { PulseDirectRuntime } from "./pulse-direct-runtime.js";
import { ProviderRuntime } from "./provider-runtime.js";

export function createAgentRuntime(config: OrchestratorConfig): AgentRuntime {
  if (config.decisionStrategy === "pulse-direct") {
    return new PulseDirectRuntime(config);
  }
  process.emitWarning(
    "AGENT_DECISION_STRATEGY=provider-runtime is now treated as a legacy path. Prefer pulse-direct for the main daily pulse flow.",
    {
      code: "AUTOPOLY_LEGACY_PROVIDER_RUNTIME"
    }
  );
  return new ProviderRuntime(config, config.runtimeProvider);
}
