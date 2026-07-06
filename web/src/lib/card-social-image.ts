import sharp from "sharp";

/** Landscape 2:1 — recommended for X / LinkedIn link previews. */
export const SOCIAL_OG_WIDTH = 1200;
export const SOCIAL_OG_HEIGHT = 630;

/** Composite the trainer card on a dark desk background for social crawlers. */
export async function buildSocialPreviewPng(facePng: Buffer): Promise<Buffer> {
  const cardHeight = SOCIAL_OG_HEIGHT - 72;
  const cardWidth = Math.round(cardHeight * (660 / 921));

  const card = await sharp(facePng)
    .resize(cardWidth, cardHeight, { fit: "inside" })
    .png()
    .toBuffer();

  const cardMeta = await sharp(card).metadata();
  const w = cardMeta.width ?? cardWidth;
  const h = cardMeta.height ?? cardHeight;
  const left = Math.round((SOCIAL_OG_WIDTH - w) / 2);
  const top = Math.round((SOCIAL_OG_HEIGHT - h) / 2);

  const background = sharp({
    create: {
      width: SOCIAL_OG_WIDTH,
      height: SOCIAL_OG_HEIGHT,
      channels: 4,
      background: { r: 14, g: 16, b: 22, alpha: 1 },
    },
  }).png();

  return background
    .composite([{ input: card, left, top }])
    .png()
    .toBuffer();
}
