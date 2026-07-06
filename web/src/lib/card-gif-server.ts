import sharp from "sharp";

const EXPORT_WIDTH = 420;
const CARD_ASPECT = 921 / 660;

/** Single-frame GIF derived from the face PNG (fast, no gifenc on the server). */
export async function buildCardGifFromPng(png: Buffer): Promise<Buffer> {
  const width = EXPORT_WIDTH;
  const height = Math.round(width * CARD_ASPECT);
  return sharp(png).resize(width, height).gif().toBuffer();
}
