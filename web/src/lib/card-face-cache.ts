import { unstable_cache } from "next/cache";
import { variantForLevel } from "./card-variant";
import { composeFacePng } from "./compose-face";
import { fetchHfProfile } from "./hf-fetcher";
import { buildCard } from "./scoring";

const getCardFaceBase64 = unstable_cache(
  async (username: string) => {
    const profile = await fetchHfProfile(username);
    const card = buildCard(profile);
    const variant = variantForLevel(card.level);
    const png = await composeFacePng(card, variant);
    return png.toString("base64");
  },
  ["huggimon-card-face"],
  { revalidate: 300 },
);

/** Cached 660×921 face PNG — shared by the page (warm) and /api/card/.../face */
export async function getCardFacePng(username: string): Promise<Buffer> {
  const b64 = await getCardFaceBase64(username);
  return Buffer.from(b64, "base64");
}
