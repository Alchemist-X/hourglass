import { LivePositions } from "../../components/live-positions";
import { getPublicPositionsData } from "../../lib/public-wallet";

export default async function PositionsPage() {
  const positions = await getPublicPositionsData();
  return <LivePositions initialData={positions} />;
}
