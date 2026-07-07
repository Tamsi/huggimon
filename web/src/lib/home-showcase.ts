import { getCardFacePng } from "@/lib/card-face-cache";
import type { CardVariant } from "@/lib/card-variant";
import { variantForLevel } from "@/lib/card-variant";
import { fetchHfProfile } from "@/lib/hf-fetcher";
import { buildCard, type CardData } from "@/lib/scoring";

export type HomeShowcaseCard = {
  card: CardData;
  variant: CardVariant;
  faceUrl: string;
  faceInline: string;
};

const SHOWCASE_USERNAMES = ["lhoestq", "lysandre", "ImTamsi"] as const;

export async function getHomeShowcaseCards(): Promise<HomeShowcaseCard[]> {
  const results = await Promise.allSettled(
    SHOWCASE_USERNAMES.map(async (username) => {
      const card = buildCard(await fetchHfProfile(username));
      const variant = variantForLevel(card.level);
      const facePng = await getCardFacePng(card.username);

      return {
        card,
        variant,
        faceUrl: `/api/card/${encodeURIComponent(card.username)}/face`,
        faceInline: `data:image/png;base64,${facePng.toString("base64")}`,
      } satisfies HomeShowcaseCard;
    }),
  );

  return results
    .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
    .sort((a, b) => a.card.level - b.card.level);
}
