import type { CardVariant } from "./card-variant";
import { cardBorderTier } from "./card-variant";
import { FACE_FONT_ATTR } from "./svg-to-png";
import { pokemonTypeInfo, typeCardTheme, type PokemonType, type TypeCardTheme, pokemonTypeLabel } from "./pokemon-types";
import type { CardData } from "./scoring";
import {
  attackRows,
  CARD_SET_SIZE,
  hpValue,
  raritySymbol,
  retreatCost,
  stageLabel,
  weaknessSymbol,
} from "./scoring";
const INFO_GOLD = "#e9c46a";

export const FACE_W = 660;
export const FACE_H = 921;

/** Official TCG outer frame colors — independent of Pokémon type */
const TCG_FRAME = {
  basic: "#ffcb05",
} as const;

const FRAME_BAND = 16;
const FRAME_OUTER_RX = 18;
const FRAME_INNER_RX = 14;

/** Opaque metallic frame band — replaces soft stroke borders on full-bleed tiers */
function buildTcgFrame(tier: ReturnType<typeof cardBorderTier>): { defs: string; markup: string } {
  if (tier === "none" || tier === "basic-yellow") {
    return { defs: "", markup: "" };
  }

  const inner = FRAME_BAND;
  const iw = FACE_W - inner * 2;
  const ih = FACE_H - inner * 2;

  if (tier === "v-black") {
    return {
      defs: `
    <linearGradient id="vFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a2a2a"/>
      <stop offset="40%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1e1e1e"/>
    </linearGradient>
    <linearGradient id="vFrameSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.14)"/>
      <stop offset="45%" stop-color="rgba(255,255,255,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
    </linearGradient>`,
      markup: `
  <mask id="tcgFrameMask">
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="#fff"/>
    <rect x="${inner}" y="${inner}" width="${iw}" height="${ih}" rx="${FRAME_INNER_RX}" fill="#000"/>
  </mask>
  <g mask="url(#tcgFrameMask)">
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="url(#vFrameGrad)"/>
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="url(#vFrameSheen)"/>
  </g>
  <rect x="${inner}" y="${inner}" width="${iw}" height="${ih}" rx="${FRAME_INNER_RX}" fill="none" stroke="#000" stroke-width="2.5"/>
  <rect x="0.75" y="0.75" width="${FACE_W - 1.5}" height="${FACE_H - 1.5}" rx="${FRAME_OUTER_RX}" fill="none" stroke="#3a3a3a" stroke-width="1.5"/>`,
    };
  }

  if (tier === "secret-gold") {
    return {
      defs: `
    <linearGradient id="goldFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5e6a8"/>
      <stop offset="35%" stop-color="#c9a227"/>
      <stop offset="70%" stop-color="#f0d878"/>
      <stop offset="100%" stop-color="#9a7b1a"/>
    </linearGradient>
    <linearGradient id="goldFrameSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.42)"/>
      <stop offset="40%" stop-color="rgba(255,236,160,0.08)"/>
      <stop offset="100%" stop-color="rgba(60,45,8,0.45)"/>
    </linearGradient>`,
      markup: `
  <mask id="tcgFrameMask">
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="#fff"/>
    <rect x="${inner}" y="${inner}" width="${iw}" height="${ih}" rx="${FRAME_INNER_RX}" fill="#000"/>
  </mask>
  <g mask="url(#tcgFrameMask)">
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="url(#goldFrameGrad)"/>
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="url(#goldFrameSheen)"/>
  </g>
  <rect x="${inner}" y="${inner}" width="${iw}" height="${ih}" rx="${FRAME_INNER_RX}" fill="none" stroke="#5c4510" stroke-width="2"/>
  <rect x="0.75" y="0.75" width="${FACE_W - 1.5}" height="${FACE_H - 1.5}" rx="${FRAME_OUTER_RX}" fill="none" stroke="#f5e6a8" stroke-width="1.25"/>`,
    };
  }

  // full-art-grey — satin silver like official V / VSTAR full arts
  return {
    defs: `
    <linearGradient id="silverFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f2f5f9"/>
      <stop offset="14%" stop-color="#b4becd"/>
      <stop offset="32%" stop-color="#e8edf4"/>
      <stop offset="52%" stop-color="#8e9aad"/>
      <stop offset="72%" stop-color="#d8dfe8"/>
      <stop offset="88%" stop-color="#a0aab8"/>
      <stop offset="100%" stop-color="#cdd5df"/>
    </linearGradient>
    <linearGradient id="silverFrameSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
      <stop offset="38%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.18)"/>
    </linearGradient>
    <filter id="silverGrain" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.72 0.045" numOctaves="4" seed="8" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0" result="mono"/>
      <feBlend in="SourceGraphic" in2="mono" mode="soft-light"/>
    </filter>`,
    markup: `
  <mask id="tcgFrameMask">
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="#fff"/>
    <rect x="${inner}" y="${inner}" width="${iw}" height="${ih}" rx="${FRAME_INNER_RX}" fill="#000"/>
  </mask>
  <g mask="url(#tcgFrameMask)" filter="url(#silverGrain)">
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="url(#silverFrameGrad)"/>
    <rect width="${FACE_W}" height="${FACE_H}" rx="${FRAME_OUTER_RX}" fill="url(#silverFrameSheen)"/>
  </g>
  <rect x="${inner}" y="${inner}" width="${iw}" height="${ih}" rx="${FRAME_INNER_RX}" fill="none" stroke="#12151c" stroke-width="2.5"/>
  <rect x="0.75" y="0.75" width="${FACE_W - 1.5}" height="${FACE_H - 1.5}" rx="${FRAME_OUTER_RX}" fill="none" stroke="#6b7585" stroke-width="1"/>`,
  };
}

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

function rgb(c: [number, number, number]): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function stageBadgeWidth(stage: string): number {
  if (stage === "Basic") return 58;
  if (stage === "Stage 1") return 72;
  return 76;
}

/** Plain type-colored circle — no emoji */
function typeDot(cx: number, cy: number, type: PokemonType, r = 17): string {
  const color = rgb(pokemonTypeInfo(type).color);
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#1f2937" stroke-width="2"/>
    <circle cx="${cx - r * 0.22}" cy="${cy - r * 0.22}" r="${r * 0.28}" fill="rgba(255,255,255,0.38)"/>`;
}

/** Reserved width for HP label + number + type dot */
const HEADER_HP_RESERVE = 112;
const TYPE_DOT_R = 17;

function hpCluster(opts: {
  rightEdge: number;
  y: number;
  hp: number;
  type: PokemonType;
  lightText?: boolean;
}): string {
  const { rightEdge, y, hp, type, lightText } = opts;
  const hpColor = lightText ? "#ffffff" : "#b91c1c";
  const stroke = lightText ? "paint-order:stroke;stroke:rgba(0,0,0,0.65);stroke-width:2.5px" : "";
  const iconCx = rightEdge - TYPE_DOT_R;
  const baseline = y + 26;
  const iconCy = baseline - 6;
  const textRight = iconCx - TYPE_DOT_R - 10;
  return `
    ${typeDot(iconCx, iconCy, type, TYPE_DOT_R)}
    <text x="${textRight}" y="${baseline}" text-anchor="end" fill="${hpColor}" style="${stroke}" ${FACE_FONT_ATTR}>
      <tspan font-size="15" font-weight="800">HP</tspan>
      <tspan font-size="34" font-weight="900" dx="5">${hp}</tspan>
    </text>`;
}

function estimateNameWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.56;
}

function fitNameText(
  name: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fill: string,
  stroke = "",
): string {
  let size = fontSize;
  const minSize = Math.max(13, Math.round(fontSize * 0.5));
  while (size > minSize && estimateNameWidth(name, size) > maxWidth) {
    size -= 1;
  }
  const strokeAttr = stroke
    ? ` style="paint-order:stroke;stroke:${stroke};stroke-width:3px"`
    : "";
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="900" fill="${fill}" ${FACE_FONT_ATTR}${strokeAttr}>${escapeXml(name)}</text>`;
}

function stageBadge(x: number, y: number, stage: string): string {
  const label = stage.toUpperCase();
  const w = stageBadgeWidth(stage);
  return `
    <rect x="${x}" y="${y}" width="${w}" height="24" rx="11" fill="#fafaf9" stroke="#57534e" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + 17}" text-anchor="middle" font-size="11" font-weight="800" letter-spacing="0.05em" fill="#1f2937" ${FACE_FONT_ATTR}>${label}</text>`;
}

const ENERGY_DOT_RADIUS = 13;
const ENERGY_DOT_SPACING = 28;
const ENERGY_NAME_GAP = 10;

function energyDotsWidth(cost: number): number {
  if (cost <= 0) return 0;
  return (cost - 1) * ENERGY_DOT_SPACING + ENERGY_DOT_RADIUS * 2;
}

function attackNameX(energyStartX: number, cost: number): number {
  return energyStartX + energyDotsWidth(cost) + ENERGY_NAME_GAP;
}

function energyCostDots(
  startX: number,
  cy: number,
  cost: number,
  type: PokemonType,
  lightText: boolean,
): string {
  const [r, g, b] = pokemonTypeInfo(type).color;
  const fill = lightText ? "rgba(255,255,255,0.94)" : rgb([r, g, b]);
  const stroke = lightText ? "#1f2937" : "#1f2937";
  return Array.from({ length: cost }, (_, j) => {
    const dotCx = startX + ENERGY_DOT_RADIUS + j * ENERGY_DOT_SPACING;
    return `
      <circle cx="${dotCx}" cy="${cy}" r="${ENERGY_DOT_RADIUS}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <circle cx="${dotCx - 3}" cy="${cy - 3}" r="4" fill="rgba(255,255,255,0.35)"/>`;
  }).join("");
}

function tcgFooter(
  x1: number,
  x2: number,
  y: number,
  card: CardData,
  theme: TypeCardTheme,
  lightText: boolean,
): string {
  const mute = lightText ? "rgba(255,255,255,0.55)" : theme.textMuted;
  const text = lightText ? "rgba(255,255,255,0.92)" : theme.text;
  const barFill = lightText ? "rgba(0,0,0,0.38)" : theme.subtitleBar;
  const weakSym = weaknessSymbol(card);
  const retreat = retreatCost(card);
  const setSym = raritySymbol(card);
  const mid = (x1 + x2) / 2;

  const retreatDots = Array.from({ length: retreat }, (_, i) => {
    const cx = mid - (retreat - 1) * 9 + i * 18;
    return `<circle cx="${cx}" cy="${y + 36}" r="9" fill="#d6d3d1" stroke="#57534e" stroke-width="1.2"/>`;
  }).join("");

  return `
    <rect x="${x1}" y="${y}" width="${x2 - x1}" height="58" rx="8" fill="${barFill}" stroke="${lightText ? "rgba(255,255,255,0.22)" : theme.attackLine}" stroke-width="1"/>
    <text x="${x1 + 10}" y="${y + 16}" font-size="9" font-weight="700" fill="${mute}" letter-spacing="0.06em" ${FACE_FONT_ATTR}>weakness</text>
    <text x="${x1 + 10}" y="${y + 34}" font-size="14" font-weight="800" fill="${text}" ${FACE_FONT_ATTR}>${escapeXml(weakSym)}×2</text>
    <text x="${x1 + 78}" y="${y + 16}" font-size="9" font-weight="700" fill="${mute}" letter-spacing="0.06em" ${FACE_FONT_ATTR}>resistance</text>
    <text x="${x1 + 78}" y="${y + 34}" font-size="14" font-weight="700" fill="${mute}" ${FACE_FONT_ATTR}>—</text>
    <text x="${mid}" y="${y + 16}" text-anchor="middle" font-size="9" font-weight="700" fill="${mute}" letter-spacing="0.06em" ${FACE_FONT_ATTR}>retreat</text>
    ${retreatDots}
    <text x="${x2 - 10}" y="${y + 16}" text-anchor="end" font-size="9" font-weight="700" fill="${mute}" letter-spacing="0.06em" ${FACE_FONT_ATTR}>set</text>
    <text x="${x2 - 10}" y="${y + 34}" text-anchor="end" font-size="14" font-weight="800" fill="${text}" ${FACE_FONT_ATTR}>${setSym} ${card.level}/${CARD_SET_SIZE}</text>`;
}

/** Bottom attack block shared by full-bleed templates */
function attacksBlock(card: CardData, yStart: number, lightText: boolean): string {
  const theme = typeCardTheme(card.type);
  const attacks = attackRows(card);
  const pad = 36;
  const textFill = lightText ? "#ffffff" : theme.attackText;
  const lineStroke = lightText ? "rgba(255,255,255,0.4)" : theme.attackLine;
  const strokeStyle = lightText
    ? "paint-order:stroke;stroke:rgba(0,0,0,0.75);stroke-width:4px"
    : "";

  return attacks
    .map(([name, dmg, cost], i) => {
      const y = yStart + i * 58;
      const energyX = pad + 16;
      const dots = energyCostDots(energyX, y + 20, cost, card.type, lightText);
      const nameX = attackNameX(energyX, cost);
      return `
        <line x1="${pad}" y1="${y - 10}" x2="${FACE_W - pad}" y2="${y - 10}" stroke="${lineStroke}" stroke-width="1.5"/>
        ${dots}
        <text x="${nameX}" y="${y + 26}" font-size="20" font-weight="800" fill="${textFill}" style="${strokeStyle}" ${FACE_FONT_ATTR}>${escapeXml(name)}</text>
        <text x="${FACE_W - pad}" y="${y + 26}" text-anchor="end" font-size="30" font-weight="900" fill="${textFill}" style="${strokeStyle}" ${FACE_FONT_ATTR}>${dmg}</text>`;
    })
    .join("");
}

/** Trainer-layout frame overlay (avatar composited underneath in art window) */
export function buildTrainerOverlaySvg(card: CardData, variant: CardVariant): string {
  const { left: ax, top: ay, width: aw, height: ah } = TRAINER_ART;
  const hp = hpValue(card);
  const theme = typeCardTheme(card.type);
  const typeLabel = pokemonTypeLabel(card.type);
  const stage = stageLabel(card);
  const attacks = attackRows(card);
  const pad = 14;
  const headerY = 28;
  const stageX = pad + 16;
  const stageW = stageBadgeWidth(stage);
  const nameX = stageX + stageW + 10;
  const contentRight = FACE_W - ax;
  const nameMaxWidth = contentRight - HEADER_HP_RESERVE - nameX;

  const metaTop = ay + ah + 10;
  const abilityTop = metaTop + 36;
  const abilityDescY = abilityTop + 40;
  const attackStartY = abilityDescY + 22;
  const attackRowStep = 44;
  const footY = attackStartY + attacks.length * attackRowStep + 14;

  const attackSvg = attacks
    .map(([name, dmg, cost], i) => {
      const y = attackStartY + i * attackRowStep;
      const energyX = ax + 10;
      const dots = energyCostDots(energyX, y + 16, cost, card.type, false);
      const nameX = attackNameX(energyX, cost);
      return `
        <line x1="${ax}" y1="${y - 6}" x2="${FACE_W - ax}" y2="${y - 6}" stroke="${theme.attackLine}" stroke-width="1.5"/>
        ${dots}
        <text x="${nameX}" y="${y + 22}" font-size="18" font-weight="800" fill="${theme.attackText}" ${FACE_FONT_ATTR}>${escapeXml(name)}</text>
        <text x="${FACE_W - ax}" y="${y + 22}" text-anchor="end" font-size="26" font-weight="900" fill="${theme.attackText}" ${FACE_FONT_ATTR}>${dmg}</text>`;
    })
    .join("");

  const badgeSuffix = variant.badge ? ` · ${variant.badge}` : "";
  const infoLine = `LV ${card.level} · ${typeLabel}${badgeSuffix} · ${card.totalModels}M · ${card.totalDatasets}D · ${card.totalFollowers} followers`;

  const nameMarkup = fitNameText(
    card.displayName,
    nameX,
    headerY + 20,
    Math.max(80, nameMaxWidth),
    26,
    theme.text,
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${FACE_W}" height="${FACE_H}" viewBox="0 0 ${FACE_W} ${FACE_H}">
  <defs>
    <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.bodyLight}"/>
      <stop offset="55%" stop-color="${theme.body}"/>
      <stop offset="100%" stop-color="${theme.bodyDark}"/>
    </linearGradient>
    <mask id="trainerBodyMask">
      <rect width="${FACE_W}" height="${FACE_H}" fill="#fff"/>
      <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" rx="6" fill="#000"/>
    </mask>
  </defs>
  <rect width="${FACE_W}" height="${FACE_H}" fill="${TCG_FRAME.basic}"/>
  <rect x="14" y="14" width="632" height="893" rx="18" fill="url(#bodyGrad)" mask="url(#trainerBodyMask)"/>
  <rect x="${ax - 5}" y="${ay - 5}" width="${aw + 10}" height="${ah + 10}" fill="none" stroke="${theme.artFrame}" stroke-width="5"/>
  ${stageBadge(stageX, headerY, stage)}
  ${nameMarkup}
  ${hpCluster({ rightEdge: contentRight, y: headerY, hp, type: card.type })}
  <rect x="${ax}" y="${metaTop}" width="${aw}" height="30" rx="4" fill="${INFO_GOLD}" stroke="${theme.artFrame}" stroke-width="1"/>
  <text x="${FACE_W / 2}" y="${metaTop + 20}" text-anchor="middle" font-size="12" font-weight="700" fill="${theme.text}" ${FACE_FONT_ATTR}>${escapeXml(infoLine)}</text>
  <rect x="${ax}" y="${abilityTop}" width="72" height="24" rx="9" fill="${theme.abilityBg}"/>
  <text x="${ax + 8}" y="${abilityTop + 17}" font-size="12" font-weight="800" fill="${theme.abilityLabel}" ${FACE_FONT_ATTR}>Ability</text>
  <text x="${ax + 80}" y="${abilityTop + 17}" font-size="15" font-weight="700" fill="${theme.text}" ${FACE_FONT_ATTR}>${escapeXml(card.passive.slice(0, 32))}</text>
  <text x="${ax}" y="${abilityDescY}" font-size="11" fill="${theme.textMuted}" ${FACE_FONT_ATTR}>Draws power from ${card.totalLikes} likes and ${card.totalDownloads} downloads.</text>
  ${attackSvg}
  ${tcgFooter(ax, FACE_W - ax, footY, card, theme, false)}
  <text x="${ax}" y="${footY + 74}" font-size="11" fill="${theme.textMuted}" ${FACE_FONT_ATTR}>${escapeXml(card.evolution.slice(0, 52))}</text>
  <text x="${FACE_W - ax}" y="${FACE_H - pad - 8}" text-anchor="end" font-size="10" fill="${theme.textMuted}" ${FACE_FONT_ATTR}>huggimon</text>
</svg>`;
}

/** Full-bleed overlay — avatar fills entire card; gradients + TCG text on top */
export function buildFullBleedOverlaySvg(
  card: CardData,
  variant: CardVariant,
  style: "full-art" | "vmax" | "rainbow" | "vstar" | "secret" | "pokemon-v",
): string {
  const hp = hpValue(card);
  const badge = variant.badge ? escapeXml(variant.badge) : "";
  const theme = typeCardTheme(card.type);
  const lightText =
    theme.fullBleedLightText || style === "rainbow" || style === "secret" || style === "vmax";

  const topGradient =
    style === "secret"
      ? `<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,214,102,0.95)"/><stop offset="55%" stop-color="rgba(212,162,39,0.42)"/><stop offset="100%" stop-color="rgba(212,162,39,0)"/></linearGradient>`
      : `<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${theme.bodyLight}ee"/><stop offset="55%" stop-color="${theme.body}66"/><stop offset="100%" stop-color="${theme.body}00"/></linearGradient>`;

  const bottomGradient =
    style === "rainbow"
      ? `<linearGradient id="bot" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="rgba(6,6,12,0.97)"/><stop offset="55%" stop-color="rgba(6,6,12,0.82)"/><stop offset="85%" stop-color="rgba(6,6,12,0.35)"/><stop offset="100%" stop-color="rgba(6,6,12,0)"/></linearGradient>`
      : style === "secret"
        ? `<linearGradient id="bot" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="rgba(15,15,20,0.94)"/><stop offset="70%" stop-color="rgba(15,15,20,0.5)"/><stop offset="100%" stop-color="rgba(15,15,20,0)"/></linearGradient>`
        : style === "vmax"
          ? `<linearGradient id="bot" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="rgba(10,10,16,0.9)"/><stop offset="65%" stop-color="${theme.bodyDark}cc"/><stop offset="100%" stop-color="${theme.body}00"/></linearGradient>`
          : `<linearGradient id="bot" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="${theme.bodyDark}f2"/><stop offset="60%" stop-color="${theme.body}99"/><stop offset="100%" stop-color="${theme.body}00"/></linearGradient>`;

  const borderTier = cardBorderTier(variant);
  const tcgFrame = buildTcgFrame(borderTier);
  const stage = stageLabel(card);
  const contentRight = FACE_W - 36;
  const headerY = 22;
  const hasSubTag = style === "vmax" || style === "rainbow" || style === "vstar" || style === "pokemon-v";
  const showStage = style === "full-art" || style === "pokemon-v";
  const nameRowY = hasSubTag ? 72 : showStage ? 68 : 58;
  const titleSize = hasSubTag ? 28 : 26;
  const nameX = showStage ? 36 + stageBadgeWidth(stage) + 10 : 36;
  const nameMaxWidth = contentRight - HEADER_HP_RESERVE - nameX;

  const vmaxTag =
    style === "vmax" || style === "rainbow"
      ? `<text x="36" y="48" font-size="18" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.75);stroke-width:4px" ${FACE_FONT_ATTR}>VMAX</text><text x="108" y="48" font-size="13" font-weight="900" fill="#fbbf24" style="paint-order:stroke;stroke:rgba(0,0,0,0.6);stroke-width:2px" ${FACE_FONT_ATTR}>★</text>`
      : style === "vstar"
        ? `<text x="36" y="48" font-size="17" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.75);stroke-width:4px" ${FACE_FONT_ATTR}>VSTAR</text>`
        : style === "pokemon-v"
          ? `<text x="36" y="48" font-size="17" font-weight="900" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,0.75);stroke-width:4px" ${FACE_FONT_ATTR}>V</text>`
          : "";

  const abilityY = style === "rainbow" || style === "secret" ? 608 : 586;
  const footY = FACE_H - 124;
  const titleFill = lightText ? "#fff" : theme.text;
  const titleStroke = lightText ? "rgba(0,0,0,0.75)" : "";
  const abilityAccent = lightText ? "#fbbf24" : theme.hp;
  const badgeSuffix = badge ? ` · ${badge}` : "";
  const nameMarkup = fitNameText(
    card.displayName,
    nameX,
    nameRowY,
    Math.max(80, nameMaxWidth),
    titleSize,
    titleFill,
    titleStroke,
  );
  const textScrim =
    style === "rainbow" || style === "secret"
      ? `<rect x="20" y="${abilityY - 32}" width="${FACE_W - 40}" height="${FACE_H - abilityY - 20}" rx="14" fill="rgba(0,0,0,0.42)"/>`
      : style === "vmax"
        ? `<rect x="20" y="${abilityY - 28}" width="${FACE_W - 40}" height="${FACE_H - abilityY - 24}" rx="14" fill="rgba(0,0,0,0.35)"/>`
        : "";
  const bottomHeight = style === "rainbow" ? 400 : 340;
  const secretTintDefs =
    style === "secret"
      ? `<linearGradient id="typeTint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff0b0" stop-opacity="0.34"/>
      <stop offset="45%" stop-color="#d4af37" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="#7a5c12" stop-opacity="0.36"/>
    </linearGradient>
    <radialGradient id="goldGleam" cx="28%" cy="22%" r="70%">
      <stop offset="0%" stop-color="rgba(255,236,170,0.5)"/>
      <stop offset="55%" stop-color="rgba(212,162,39,0.18)"/>
      <stop offset="100%" stop-color="rgba(154,123,26,0)"/>
    </radialGradient>`
      : `<linearGradient id="typeTint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.bodyLight}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${theme.bodyDark}" stop-opacity="0.2"/>
    </linearGradient>`;
  const secretTintMarkup =
    style === "secret"
      ? `<rect width="${FACE_W}" height="${FACE_H}" fill="url(#typeTint)"/>
  <rect width="${FACE_W}" height="${FACE_H}" fill="url(#goldGleam)"/>`
      : `<rect width="${FACE_W}" height="${FACE_H}" fill="url(#typeTint)"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${FACE_W}" height="${FACE_H}" viewBox="0 0 ${FACE_W} ${FACE_H}">
  <defs>
    ${topGradient}
    ${bottomGradient}
    ${tcgFrame.defs}
    ${secretTintDefs}
    <radialGradient id="vig" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
    </radialGradient>
  </defs>
  ${secretTintMarkup}
  <rect width="${FACE_W}" height="${FACE_H}" fill="url(#vig)"/>
  <rect width="${FACE_W}" height="160" fill="url(#top)"/>
  <rect y="${FACE_H - bottomHeight}" width="${FACE_W}" height="${bottomHeight}" fill="url(#bot)"/>
  ${textScrim}
  ${showStage ? stageBadge(36, headerY, stage) : ""}
  ${vmaxTag}
  ${nameMarkup}
  ${hpCluster({ rightEdge: contentRight, y: headerY, hp, type: card.type, lightText })}
  <rect x="36" y="${abilityY - 36}" width="${FACE_W - 72}" height="28" rx="6" fill="${lightText ? "rgba(0,0,0,0.45)" : INFO_GOLD}" opacity="0.92"/>
  <text x="${FACE_W / 2}" y="${abilityY - 16}" text-anchor="middle" font-size="12" font-weight="700" fill="${lightText ? "#fff" : theme.text}" ${FACE_FONT_ATTR}>LV ${card.level} · ${escapeXml(pokemonTypeLabel(card.type))}${badgeSuffix} · ${card.totalFollowers} followers</text>
  <text x="36" y="${abilityY}" font-size="16" font-weight="800" fill="${lightText ? "#fff" : theme.text}" style="paint-order:stroke;stroke:${lightText ? "rgba(0,0,0,0.75)" : "none"};stroke-width:3px" ${FACE_FONT_ATTR}>
    <tspan fill="${abilityAccent}" font-size="14" font-weight="900">Ability</tspan>  ${escapeXml(card.passive)}
  </text>
  ${attacksBlock(card, abilityY + 36, lightText)}
  ${tcgFooter(36, FACE_W - 36, footY, card, theme, lightText)}
  <text x="36" y="${footY + 74}" font-size="11" fill="${lightText ? "rgba(255,255,255,0.7)" : theme.textMuted}" ${FACE_FONT_ATTR}>${escapeXml(card.evolution.slice(0, 48))}</text>
  <text x="${FACE_W - 36}" y="${footY + 74}" text-anchor="end" font-size="11" fill="${lightText ? "rgba(255,255,255,0.55)" : theme.textMuted}" ${FACE_FONT_ATTR}>huggimon</text>
  ${tcgFrame.markup}
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
