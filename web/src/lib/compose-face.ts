import sharp from "sharp";
import type { CardVariant } from "./card-variant";
import { FACE_H, FACE_W, overlaySvgForVariant, TRAINER_ART } from "./face-overlay";
import type { CardData } from "./scoring";
import { typeColorRgb } from "./pokemon-types";

async function fetchAvatarBuffer(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "HuggiMon/1.0" } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function placeholderAvatar(card: CardData): Buffer {
  const [r, g, b] = typeColorRgb(card.type);
  const initial = (card.username[0] ?? "?").toUpperCase();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${FACE_W}" height="${FACE_H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 40)})"/>
      <stop offset="100%" stop-color="rgb(${Math.floor(r * 0.5)},${Math.floor(g * 0.5)},${Math.floor(b * 0.5)})"/>
    </linearGradient>
  </defs>
  <rect width="${FACE_W}" height="${FACE_H}" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="120" font-weight="900" fill="rgba(255,255,255,0.35)">${initial}</text>
</svg>`;
  return Buffer.from(svg);
}

async function avatarFullBleed(avatar: Buffer | null, card: CardData): Promise<Buffer> {
  const source = avatar ?? placeholderAvatar(card);
  return sharp(source)
    .resize(FACE_W, FACE_H, { fit: "cover", position: "attention" })
    .png()
    .toBuffer();
}

async function trainerArtLayer(avatar: Buffer | null, card: CardData): Promise<Buffer> {
  const { width, height } = TRAINER_ART;
  if (avatar) {
    return sharp(avatar)
      .resize(width, height, { fit: "cover", position: "attention" })
      .png()
      .toBuffer();
  }

  return sharp(placeholderAvatar(card))
    .resize(width, height, { fit: "cover" })
    .png()
    .toBuffer();
}

/**
 * Compose a 660×921 TCG face: user avatar + pre-made template overlay.
 * Trainer tiers paste the avatar above the SVG overlay — librsvg ignores masks
 * so the art window must not rely on SVG transparency alone.
 */
export async function composeFacePng(card: CardData, variant: CardVariant): Promise<Buffer> {
  const isFullBleed = variant.faceTemplate !== "trainer";
  const overlaySvg = overlaySvgForVariant(card, variant);
  const overlayP = sharp(Buffer.from(overlaySvg)).png().toBuffer();
  const avatarP = fetchAvatarBuffer(card.avatarUrl);

  if (isFullBleed) {
    const [base, overlay] = await Promise.all([
      avatarP.then((avatar) => avatarFullBleed(avatar, card)),
      overlayP,
    ]);
    return sharp(base)
      .composite([{ input: overlay, top: 0, left: 0 }])
      .png({ compressionLevel: 9, effort: 4 })
      .toBuffer();
  }

  const { left, top } = TRAINER_ART;
  const [avatar, overlay] = await Promise.all([avatarP, overlayP]);
  const art = await trainerArtLayer(avatar, card);

  return sharp({
    create: {
      width: FACE_W,
      height: FACE_H,
      channels: 3,
      background: { r: 255, g: 203, b: 5 },
    },
  })
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: art, left, top },
    ])
    .png({ compressionLevel: 9, effort: 4 })
    .toBuffer();
}
