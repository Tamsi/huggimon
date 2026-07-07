import { unstable_cache } from "next/cache";
import { getCardFacePng } from "./card-face-cache";
import { buildSocialPreviewPng } from "./card-social-image";

const getSocialBase64 = unstable_cache(
  async (username: string) => {
    const face = await getCardFacePng(username);
    const png = await buildSocialPreviewPng(face);
    return png.toString("base64");
  },
  ["huggimon-card-social-v4"],
  { revalidate: 300 },
);

/** Cached 1200×630 PNG for Open Graph / Twitter Card crawlers. */
export async function getCardSocialPng(username: string): Promise<Buffer> {
  const b64 = await getSocialBase64(username);
  return Buffer.from(b64, "base64");
}
