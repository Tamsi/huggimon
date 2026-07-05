import sharp from "sharp";
import type { CardVariant } from "./card-variant";
import { FACE_H, FACE_W, overlaySvgForVariant, TRAINER_ART } from "./face-overlay";
import type { CardData } from "./scoring";
import { ENERGY_BY_TYPE, COLORLESS } from "./energy";

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
  const e = ENERGY_BY_TYPE[card.type] ?? COLORLESS;
  const [r, g, b] = e.color;
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

async function avatarTrainerWindow(avatar: Buffer | null, card: CardData): Promise<Buffer> {
  const { left, top, width, height } = TRAINER_ART;
  const base = sharp({
    create: {
      width: FACE_W,
      height: FACE_H,
      channels: 3,
      background: { r: 200, g: 205, b: 212 },
    },
  });

  if (avatar) {
    const art = await sharp(avatar)
      .resize(width, height, { fit: "cover", position: "attention" })
      .png()
      .toBuffer();
    return base
      .composite([{ input: art, left, top }])
      .png()
      .toBuffer();
  }

  const ph = await sharp(placeholderAvatar(card))
    .extract({ left: 0, top: 0, width: FACE_W, height: Math.min(FACE_H, top + height) })
    .resize(width, height, { fit: "cover" })
    .png()
    .toBuffer();

  return base.composite([{ input: ph, left, top }]).png().toBuffer();
}

/**
 * Compose a 660×921 TCG face: user avatar + pre-made template overlay.
 * Full-bleed tiers fill the card like official alt-art scans for pokemon-cards-css.
 */
export async function composeFacePng(card: CardData, variant: CardVariant): Promise<Buffer> {
  const avatar = await fetchAvatarBuffer(card.avatarUrl);
  const isFullBleed = variant.faceTemplate !== "trainer";

  const base = isFullBleed
    ? await avatarFullBleed(avatar, card)
    : await avatarTrainerWindow(avatar, card);

  const overlaySvg = overlaySvgForVariant(card, variant);
  const overlay = await sharp(Buffer.from(overlaySvg)).png().toBuffer();

  return sharp(base)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ quality: 95 })
    .toBuffer();
}
