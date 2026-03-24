import { getPublicTradesData } from "../../../../lib/public-wallet";

export async function GET() {
  return Response.json(await getPublicTradesData());
}
