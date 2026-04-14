import { HeroSection } from "../components/showcase/sections/hero-section";
import { ResourcesBar } from "../components/showcase/sections/resources-bar";
import { ProblemSolution } from "../components/showcase/sections/problem-solution";
import { MarketEncounter } from "../components/showcase/sections/market-encounter";
import { MarketList } from "../components/showcase/sections/market-list";
import { AveApiSection } from "../components/showcase/sections/ave-api-section";
import { SkillCardsGrid } from "../components/showcase/sections/skill-cards-grid";
import { SignalAggregation } from "../components/showcase/sections/signal-aggregation";
import { DetailedAnalysis } from "../components/showcase/sections/detailed-analysis";
import { AutoResearch } from "../components/showcase/sections/auto-research";
import { TradeExecution } from "../components/showcase/sections/trade-execution";
import { TradeHistory } from "../components/showcase/sections/trade-history";
import { ThinkingTimeline } from "../components/showcase/sections/thinking-timeline";
import { Architecture } from "../components/showcase/sections/architecture";
import { FooterSection } from "../components/showcase/sections/footer-section";
import { loadShowcaseData } from "../lib/showcase-data";

import "../components/showcase/sts-theme/sts-theme.css";

// Revalidate the page every 5 minutes. The Gamma API responses themselves are
// already cached at fetch level, but this gives the page a stable ISR cadence.
export const revalidate = 300;

export default async function ShowcasePage() {
  const data = await loadShowcaseData();

  return (
    <main>
      <HeroSection />
      <ResourcesBar />
      <ProblemSolution />
      <MarketEncounter />
      <MarketList
        markets={data.topMarkets}
        totalScanned={data.totalMarketsScanned}
        matchedCount={data.matchedMarketCount}
        rejectedCount={data.rejectedMarketCount}
      />
      <AveApiSection
        calls={data.aveApiCalls}
        isLive={data.aveIsLive}
        fallbackReason={data.aveFallbackReason}
      />
      <SkillCardsGrid />
      <SignalAggregation />
      {data.topAnalysis && <DetailedAnalysis analysis={data.topAnalysis} />}
      <AutoResearch />
      <TradeExecution />
      <TradeHistory />
      <ThinkingTimeline />
      <Architecture />
      <FooterSection />
    </main>
  );
}
