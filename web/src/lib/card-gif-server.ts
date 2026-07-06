import { applyPalette, GIFEncoder, quantize } from "gifenc";
import sharp from "sharp";

const EXPORT_WIDTH = 420;
const CARD_ASPECT = 921 / 660;
const FRAME_COUNT = 12;
const FRAME_DELAY_CS = 10;

/** Animated GIF from the face PNG — holo shimmer for social link previews. */
export async function buildCardGifFromPng(png: Buffer): Promise<Buffer> {
  const width = EXPORT_WIDTH;
  const height = Math.round(width * CARD_ASPECT);
  const gif = GIFEncoder();
  const base = sharp(png).resize(width, height).ensureAlpha();

  for (let i = 0; i < FRAME_COUNT; i++) {
    const phase = (i / FRAME_COUNT) * Math.PI * 2;
    const brightness = 1 + 0.08 * Math.sin(phase);
    const saturation = 1 + 0.15 * Math.cos(phase * 1.3);
    const hue = Math.round(8 * Math.sin(phase * 0.7));

    const { data, info } = await base
      .clone()
      .modulate({ brightness, saturation, hue })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rgba = new Uint8ClampedArray(
      data.buffer,
      data.byteOffset,
      data.byteLength,
    );
    const palette = quantize(rgba, 128);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, info.width, info.height, {
      palette,
      delay: FRAME_DELAY_CS,
    });
  }

  gif.finish();
  return Buffer.from(gif.bytes());
}
