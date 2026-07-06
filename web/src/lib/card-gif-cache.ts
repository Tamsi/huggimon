import { unstable_cache } from "next/cache";
import { getCardFacePng } from "./card-face-cache";
import { buildCardGifFromPng } from "./card-gif-server";

const getGifBase64 = unstable_cache(
  async (username: string) => {
    const face = await getCardFacePng(username);
    const gif = await buildCardGifFromPng(face);
    return gif.toString("base64");
  },
  ["huggimon-card-gif-v1"],
  { revalidate: 300 },
);

export async function getCardGif(username: string): Promise<Buffer> {
  const b64 = await getGifBase64(username);
  return Buffer.from(b64, "base64");
}
