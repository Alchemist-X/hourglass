import { existsSync } from "node:fs";
import path from "node:path";
import type {
  AgentRuntimeProvider,
  OrchestratorConfig,
  SkillLocale,
  SkillProviderConfig
} from "../config.js";

export type SupportedSkillId =
  | "polymarket-market-pulse"
  | "portfolio-review-polymarket"
  | "poly-position-monitor"
  | "poly-resolution-tracking"
  | "api-trade-polymarket";

export interface ResolvedSkillDescriptor {
  id: SupportedSkillId;
  skillDir: string;
  skillFile: string;
}

export interface ResolvedProviderSkillSettings {
  provider: AgentRuntimeProvider;
  command: string;
  model: string;
  locale: SkillLocale;
  skillRootDir: string;
  skills: ResolvedSkillDescriptor[];
}

const SUPPORTED_SKILLS: SupportedSkillId[] = [
  "polymarket-market-pulse",
  "portfolio-review-polymarket",
  "poly-position-monitor",
  "poly-resolution-tracking",
  "api-trade-polymarket"
];

function skillDirectoryName(skill: SupportedSkillId, locale: SkillLocale): string {
  if (skill === "api-trade-polymarket") {
    return "api-trade-polymarket";
  }
  return locale === "zh" ? `${skill}-zh` : skill;
}

function parseSkillList(raw: string): SupportedSkillId[] {
  const requested = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (requested.length === 0) {
    return SUPPORTED_SKILLS;
  }

  return requested.map((value) => {
    if (!SUPPORTED_SKILLS.includes(value as SupportedSkillId)) {
      throw new Error(`Unsupported skill id: ${value}`);
    }
    return value as SupportedSkillId;
  });
}

function resolveSkillDescriptors(config: SkillProviderConfig): ResolvedSkillDescriptor[] {
  return parseSkillList(config.skills).map((skill) => {
    const skillDir = path.resolve(config.skillRootDir, skillDirectoryName(skill, config.skillLocale));
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!existsSync(skillFile)) {
      throw new Error(`Missing skill file for ${skill}: ${skillFile}`);
    }
    return {
      id: skill,
      skillDir,
      skillFile
    };
  });
}

export function resolveEffectiveProvider(config: OrchestratorConfig, provider: AgentRuntimeProvider): string {
  if (provider !== "none") {
    return provider;
  }
  return Object.keys(config.providers)[0] ?? "none";
}

export function getProviderSkillConfig(config: OrchestratorConfig, provider: AgentRuntimeProvider): SkillProviderConfig {
  const effectiveProvider = resolveEffectiveProvider(config, provider);
  const providerConfig = config.providers[effectiveProvider];
  if (!providerConfig) {
    throw new Error(
      `No skill configuration found for provider "${provider}". ` +
      `Available providers: ${Object.keys(config.providers).join(", ") || "(none)"}.`
    );
  }
  return providerConfig;
}

export function resolveProviderSkillSettings(
  config: OrchestratorConfig,
  provider: AgentRuntimeProvider
): ResolvedProviderSkillSettings {
  const effectiveProvider = resolveEffectiveProvider(config, provider);
  const providerConfig = getProviderSkillConfig(config, effectiveProvider);
  return {
    provider: effectiveProvider,
    command: providerConfig.command,
    model: providerConfig.model,
    locale: providerConfig.skillLocale,
    skillRootDir: path.resolve(providerConfig.skillRootDir),
    skills: resolveSkillDescriptors(providerConfig)
  };
}
