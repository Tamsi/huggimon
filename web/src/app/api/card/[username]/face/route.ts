import { NextResponse } from "next/server";
import sharp from "sharp";
import { variantForLevel } from "@/lib/card-variant";
import { composeFacePng } from "@/lib/compose-face";
import { fetchHfProfile } from "@/lib/hf-fetcher";
import { buildCard } from "@/lib/scoring";

export const runtime = "nodejs";

type Params = { params: Promise<{ username: string }> };

export async function GET(req: Request, { params }: Params) {
  const { username } = await params;
  const story = new URL(req.url).searchParams.get("story") === "1";
  try {
    const profile = await fetchHfProfile(username);
    const card = buildCard(profile);
    const variant = variantForLevel(card.level);
    let png = await composeFacePng(card, variant);

    if (story) {
      png = await sharp(png)
        .resize(1080, 1920, { fit: "cover", position: "centre" })
        .png()
        .toBuffer();
    }

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
