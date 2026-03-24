import { LivePositions } from "../../components/live-positions";
import { getPublicPositionsData } from "../../lib/public-wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PositionsPage() {
  const positions = await getPublicPositionsData();
  return <LivePositions initialData={positions} />;
}
