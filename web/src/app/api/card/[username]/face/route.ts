import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCardFacePng } from "@/lib/card-face-cache";

export const runtime = "nodejs";

type Params = { params: Promise<{ username: string }> };

export async function GET(req: Request, { params }: Params) {
  const { username } = await params;
  const story = new URL(req.url).searchParams.get("story") === "1";
  try {
    let png = await getCardFacePng(username);

    if (story) {
      png = await sharp(png)
        .resize(1080, 1920, { fit: "cover", position: "centre" })
        .png()
        .toBuffer();
    }

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
