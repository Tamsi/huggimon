import { NextResponse } from "next/server";
import { variantForLevel } from "@/lib/card-variant";
import { fetchHfProfile } from "@/lib/hf-fetcher";
import { buildCard } from "@/lib/scoring";

type Params = { params: Promise<{ username: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { username } = await params;
  try {
    const profile = await fetchHfProfile(username);
    const card = buildCard(profile);
    const variant = variantForLevel(card.level);
    return NextResponse.json(
      { card, variant },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
