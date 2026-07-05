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
    return NextResponse.json({
      username: card.username,
      displayName: card.displayName,
      level: card.level,
      type: card.type,
      rarity: card.rarity,
      variant: variant.name,
      dataRarity: variant.dataRarity,
      stats: card.stats,
      attacks: card.attacks,
      passive: card.passive,
      evolution: card.evolution,
      energy: { name: card.energyName, symbol: card.energySymbol, count: card.energyCount },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
