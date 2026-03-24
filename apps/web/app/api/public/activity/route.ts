import { getSpectatorActivityData } from "../../../../lib/public-wallet";

export async function GET() {
  return Response.json(await getSpectatorActivityData());
}
