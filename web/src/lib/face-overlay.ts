import type { CardVariant } from "./card-variant";
import { ENERGY_BY_TYPE, COLORLESS } from "./energy";
import type { CardData } from "./scoring";
import { attackRows, hpValue } from "./scoring";

export const FACE_W = 660;
export const FACE_H = 921;

/** Trainer art window — matches pokemon-cards-css --clip-trainer */
export const TRAINER_ART = {
  left: Math.round(FACE_W * 0.085),
  top: Math.round(FACE_H * 0.145),
  width: Math.round(FACE_W * 0.83),
  height: Math.round(FACE_H * 0.373),
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function energyRgb(type: string): string {
  const e = ENERGY_BY_TYPE[type] ?? COLORLESS;
  const [r, g, b] = e.color;
  return `rgb(${r},${g},${b})`;
}

/** Bottom attack block shared by full-bleed templates */
function attacksBlock(card: CardData, yStart: number): string {
  const attacks = attackRows(card);
  const pad = 36;
  return attacks
    .map(([name, dmg, cost], i) => {
      const y = yStart + i * 52;
      const dots = Array.from({ length: cost }, (_, j) => {
        const cx = pad + 14 + j * 28;
        return `<circle cx="${cx}" cy="${y + 18}" r="11" fill="rgba(255,255,255,0.85)" stroke="#1f2937" stroke-width="1.5"/>
          <text x="${cx}" y="${y + 22}" text-anchor="middle" font-size="11">${escapeXml(card.energySymbol)}</text>`;
      }).join("");
      return `
        <line x1="${pad}" y1="${y - 8}" x2="${FACE_W - pad}" y2="${y - 8}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
        ${dots}
        <text x="${pad + 100}" y="${y + 22}" font-size="17" font-weight="800" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.65);stroke-width:3px">${escapeXml(name)}</text>
        <text x="${FACE_W - pad}" y="${y + 22}" text-anchor="end" font-size="24" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.65);stroke-width:3px">${dmg}</text>`;
    })
    .join("");
}

/** Trainer-layout frame overlay (avatar composited underneath in art window) */
export function buildTrainerOverlaySvg(card: CardData, variant: CardVariant): string {
  const { left: ax, top: ay, width: aw, height: ah } = TRAINER_ART;
  const hp = hpValue(card);
  const accent = energyRgb(card.type);
  const attacks = attackRows(card);

  const attackSvg = attacks
    .map(([name, dmg, cost], i) => {
      const y = 620 + i * 34;
      const dots = Array.from({ length: cost }, (_, j) => {
        const cx = ax + 16 + j * 20;
        return `<circle cx="${cx}" cy="${y + 14}" r="8" fill="${accent}" stroke="#1f2937"/><text x="${cx}" y="${y + 17}" text-anchor="middle" font-size="9">${escapeXml(card.energySymbol)}</text>`;
      }).join("");
      return `${dots}<text x="${ax + 90}" y="${y + 18}" font-size="14" font-weight="700" fill="#1f2937">${escapeXml(name)}</text><text x="${FACE_W - 50}" y="${y + 18}" text-anchor="end" font-size="20" font-weight="700" fill="#1f2937">${dmg}</text><line x1="${ax}" y1="${y}" x2="${FACE_W - ax}" y2="${y}" stroke="#1f2937"/>`;
    })
    .join("");

  const badge = variant.badge
    ? `<rect x="340" y="30" rx="8" width="${variant.badge.length * 9 + 16}" height="22" fill="${accent}"/><text x="348" y="45" font-size="11" font-weight="800" fill="#1f2937">${escapeXml(variant.badge)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${FACE_W}" height="${FACE_H}" viewBox="0 0 ${FACE_W} ${FACE_H}">
  <rect width="${FACE_W}" height="${FACE_H}" fill="#c8cdd4"/>
  <rect x="14" y="14" width="632" height="893" rx="18" fill="#ebe2b0" stroke="${accent}" stroke-width="6"/>
  <rect x="${ax - 5}" y="${ay - 5}" width="${aw + 10}" height="${ah + 10}" fill="none" stroke="#c4a84b" stroke-width="5"/>
  <rect x="${ax}" y="${ay + ah + 10}" width="${aw}" height="26" rx="4" fill="#e9c46a"/>
  <text x="${FACE_W / 2}" y="${ay + ah + 28}" text-anchor="middle" font-size="12" font-weight="700" fill="#1f2937">LV${card.level} · ${escapeXml(card.type)} · ${card.totalFollowers} followers</text>
  <rect x="${ax}" y="${ay + ah + 48}" width="58" height="18" rx="8" fill="#b91c1c"/>
  <text x="${ax + 6}" y="${ay + ah + 61}" font-size="10" font-weight="700" fill="#fff">Ability</text>
  <text x="${ax + 66}" y="${ay + ah + 61}" font-size="12" fill="#1f2937">${escapeXml(card.passive)}</text>
  <text x="110" y="48" font-size="28" font-weight="800" fill="#1f2937">${escapeXml(card.displayName.slice(0, 20))}</text>
  ${badge}
  <text x="${FACE_W - 50}" y="36" text-anchor="end" font-size="13" font-weight="800" fill="#b91c1c">HP</text>
  <text x="${FACE_W - 50}" y="58" text-anchor="end" font-size="32" font-weight="900" fill="#b91c1c">${hp}</text>
  ${attackSvg}
</svg>`;
}

/** Full-bleed overlay — avatar fills entire card; gradients + TCG text on top */
export function buildFullBleedOverlaySvg(
  card: CardData,
  variant: CardVariant,
  style: "full-art" | "vmax" | "rainbow" | "vstar" | "secret" | "pokemon-v",
): string {
  const hp = hpValue(card);
  const name = escapeXml(card.displayName.slice(0, 24));
  const badge = variant.badge ? escapeXml(variant.badge) : "";
  const accent = energyRgb(card.type);

  const topGradient =
    style === "secret"
      ? `<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(212,175,55,0.92)"/><stop offset="100%" stop-color="rgba(212,175,55,0)"/></linearGradient>`
      : `<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.88)"/><stop offset="55%" stop-color="rgba(255,255,255,0.15)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient>`;

  const bottomGradient =
    style === "rainbow" || style === "secret"
      ? `<linearGradient id="bot" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="rgba(15,15,20,0.92)"/><stop offset="70%" stop-color="rgba(15,15,20,0.45)"/><stop offset="100%" stop-color="rgba(15,15,20,0)"/></linearGradient>`
      : `<linearGradient id="bot" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="rgba(255,255,255,0.95)"/><stop offset="60%" stop-color="rgba(255,255,255,0.35)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient>`;

  const border =
    style === "secret"
      ? `<rect x="8" y="8" width="644" height="905" rx="20" fill="none" stroke="#d4af37" stroke-width="5"/>`
      : style === "rainbow"
        ? `<rect x="6" y="6" width="648" height="909" rx="22" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="3"/>`
        : `<rect x="10" y="10" width="640" height="901" rx="18" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>`;

  const titleSize = style === "vmax" ? 34 : 30;
  const vmaxTag =
    style === "vmax" || style === "rainbow"
      ? `<text x="36" y="52" font-size="22" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.7);stroke-width:4px">VMAX</text>`
      : style === "vstar"
        ? `<text x="36" y="52" font-size="20" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.7);stroke-width:4px">VSTAR</text>`
        : style === "pokemon-v"
          ? `<text x="36" y="52" font-size="20" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.7);stroke-width:4px">V</text>`
          : "";

  const abilityY = style === "rainbow" || style === "secret" ? 680 : 640;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${FACE_W}" height="${FACE_H}" viewBox="0 0 ${FACE_W} ${FACE_H}">
  <defs>
    ${topGradient}
    ${bottomGradient}
    <radialGradient id="vig" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
    </radialGradient>
  </defs>
  <rect width="${FACE_W}" height="${FACE_H}" fill="url(#vig)"/>
  <rect width="${FACE_W}" height="160" fill="url(#top)"/>
  <rect y="${FACE_H - 340}" width="${FACE_W}" height="340" fill="url(#bot)"/>
  ${border}
  ${vmaxTag}
  <text x="36" y="${style === "vmax" || style === "rainbow" ? 88 : 72}" font-size="${titleSize}" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.75);stroke-width:4px">${name}</text>
  ${badge ? `<rect x="36" y="96" rx="8" width="${badge.length * 11 + 18}" height="24" fill="${accent}" opacity="0.95"/><text x="46" y="114" font-size="12" font-weight="800" fill="#1f2937">${badge}</text>` : ""}
  <text x="${FACE_W - 36}" y="56" text-anchor="end" font-size="14" font-weight="800" fill="#fff" style="paint-order:stroke;stroke:rgba(185,28,28,0.9);stroke-width:2px">HP</text>
  <text x="${FACE_W - 36}" y="88" text-anchor="end" font-size="36" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(185,28,28,0.95);stroke-width:3px">${hp}</text>
  <text x="36" y="${abilityY}" font-size="13" font-weight="800" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.7);stroke-width:3px">
    <tspan fill="#fca5a5">Ability</tspan>  ${escapeXml(card.passive)}
  </text>
  ${attacksBlock(card, abilityY + 36)}
  <text x="36" y="${FACE_H - 24}" font-size="10" fill="rgba(255,255,255,0.7)">${escapeXml(card.evolution.slice(0, 48))}</text>
  <text x="${FACE_W - 36}" y="${FACE_H - 24}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.55)">${card.level}/151 · huggimon</text>
</svg>`;
}

export function overlaySvgForVariant(card: CardData, variant: CardVariant): string {
  switch (variant.faceTemplate) {
    case "trainer":
      return buildTrainerOverlaySvg(card, variant);
    case "pokemon-v":
      return buildFullBleedOverlaySvg(card, variant, "pokemon-v");
    case "full-art":
      return buildFullBleedOverlaySvg(card, variant, "full-art");
    case "vmax":
      return buildFullBleedOverlaySvg(card, variant, "vmax");
    case "rainbow":
      return buildFullBleedOverlaySvg(card, variant, "rainbow");
    case "vstar":
      return buildFullBleedOverlaySvg(card, variant, "vstar");
    case "secret":
      return buildFullBleedOverlaySvg(card, variant, "secret");
    default:
      return buildTrainerOverlaySvg(card, variant);
  }
}
