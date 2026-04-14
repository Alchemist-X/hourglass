import { HeroSection } from "../components/showcase/sections/hero-section";
import { ProblemSolution } from "../components/showcase/sections/problem-solution";
import { MarketEncounter } from "../components/showcase/sections/market-encounter";
import { SkillCardsGrid } from "../components/showcase/sections/skill-cards-grid";
import { SignalAggregation } from "../components/showcase/sections/signal-aggregation";
import { AutoResearch } from "../components/showcase/sections/auto-research";
import { TradeExecution } from "../components/showcase/sections/trade-execution";
import { TradeHistory } from "../components/showcase/sections/trade-history";
import { ThinkingTimeline } from "../components/showcase/sections/thinking-timeline";
import { Architecture } from "../components/showcase/sections/architecture";
import { FooterSection } from "../components/showcase/sections/footer-section";

import "../components/showcase/sts-theme/sts-theme.css";

export default function ShowcasePage() {
  return (
    <main>
      <HeroSection />
      <ProblemSolution />
      <MarketEncounter />
      <SkillCardsGrid />
      <SignalAggregation />
      <AutoResearch />
      <TradeExecution />
      <TradeHistory />
      <ThinkingTimeline />
      <Architecture />
      <FooterSection />
    </main>
  );
}
