import { NextResponse } from "next/server";
import { buildCardGifFromPng } from "@/lib/card-gif-server";
import { getCardFacePng } from "@/lib/card-face-cache";

export const runtime = "nodejs";

type Params = { params: Promise<{ username: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { username } = await params;
  try {
    const png = await getCardFacePng(username);
    const gif = await buildCardGifFromPng(png);

    return new NextResponse(new Uint8Array(gif), {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control":
          "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
