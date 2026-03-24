import { getPublicOverviewData } from "../../../../lib/public-wallet";

export async function GET() {
  return Response.json(await getPublicOverviewData());
}
