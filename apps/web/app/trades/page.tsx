import { LiveTrades } from "../../components/live-trades";
import { getPublicTradesData } from "../../lib/public-wallet";

export default async function TradesPage() {
  const trades = await getPublicTradesData();
  return <LiveTrades initialData={trades} />;
}
