/** Pokémon TCG types assigned from the first letter of a Hugging Face username */

export type PokemonType =
  | "Normal"
  | "Fire"
  | "Water"
  | "Grass"
  | "Electric"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon"
  | "Dark"
  | "Steel"
  | "Fairy";

export type PokemonTypeInfo = {
  nameEn: PokemonType;
  nameFr: string;
  symbol: string;
  color: [number, number, number];
  /** pokemon-cards-css `.card.{cssClass}` glow hook */
  cssClass: string;
};

/** TCG card body colors — main fill, gradients, readable text */
export type TypeCardTheme = {
  shell: string;
  body: string;
  bodyLight: string;
  bodyDark: string;
  border: string;
  artFrame: string;
  subtitleBar: string;
  text: string;
  textMuted: string;
  hp: string;
  abilityBg: string;
  abilityLabel: string;
  attackLine: string;
  attackText: string;
  energyDot: string;
  energyDotStroke: string;
  /** Light attack text on full-bleed rare templates */
  fullBleedLightText: boolean;
};

const TYPE_CARD_THEMES: Record<PokemonType, TypeCardTheme> = {
  Normal: {
    shell: "#b8b8b0",
    body: "#ebe8df",
    bodyLight: "#f7f5ef",
    bodyDark: "#d8d4c8",
    border: "#a8a29e",
    artFrame: "#c4bfb4",
    subtitleBar: "#ddd9ce",
    text: "#1f2937",
    textMuted: "#57534e",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#78716c",
    attackText: "#1f2937",
    energyDot: "#a8a29e",
    energyDotStroke: "#57534e",
    fullBleedLightText: false,
  },
  Fire: {
    shell: "#c2410c",
    body: "#fca5a5",
    bodyLight: "#fecaca",
    bodyDark: "#f87171",
    border: "#dc2626",
    artFrame: "#ef4444",
    subtitleBar: "#fdba74",
    text: "#1f2937",
    textMuted: "#7c2d12",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#9a3412",
    attackText: "#1f2937",
    energyDot: "#ef4444",
    energyDotStroke: "#7f1d1d",
    fullBleedLightText: false,
  },
  Water: {
    shell: "#1d4ed8",
    body: "#93c5fd",
    bodyLight: "#bfdbfe",
    bodyDark: "#60a5fa",
    border: "#2563eb",
    artFrame: "#3b82f6",
    subtitleBar: "#7dd3fc",
    text: "#1e3a5f",
    textMuted: "#1e40af",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#1d4ed8",
    attackText: "#1e3a5f",
    energyDot: "#3b82f6",
    energyDotStroke: "#1e3a8a",
    fullBleedLightText: false,
  },
  Grass: {
    shell: "#15803d",
    body: "#86efac",
    bodyLight: "#bbf7d0",
    bodyDark: "#4ade80",
    border: "#16a34a",
    artFrame: "#22c55e",
    subtitleBar: "#a3e635",
    text: "#14532d",
    textMuted: "#166534",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#15803d",
    attackText: "#14532d",
    energyDot: "#22c55e",
    energyDotStroke: "#14532d",
    fullBleedLightText: false,
  },
  Electric: {
    shell: "#ca8a04",
    body: "#fde047",
    bodyLight: "#fef08a",
    bodyDark: "#facc15",
    border: "#eab308",
    artFrame: "#fbbf24",
    subtitleBar: "#fde68a",
    text: "#1f2937",
    textMuted: "#854d0e",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#a16207",
    attackText: "#1f2937",
    energyDot: "#eab308",
    energyDotStroke: "#713f12",
    fullBleedLightText: false,
  },
  Ice: {
    shell: "#0284c7",
    body: "#bae6fd",
    bodyLight: "#e0f2fe",
    bodyDark: "#7dd3fc",
    border: "#0ea5e9",
    artFrame: "#38bdf8",
    subtitleBar: "#a5f3fc",
    text: "#0c4a6e",
    textMuted: "#0369a1",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#0284c7",
    attackText: "#0c4a6e",
    energyDot: "#0ea5e9",
    energyDotStroke: "#075985",
    fullBleedLightText: false,
  },
  Fighting: {
    shell: "#9a3412",
    body: "#d97706",
    bodyLight: "#f59e0b",
    bodyDark: "#b45309",
    border: "#c2410c",
    artFrame: "#ea580c",
    subtitleBar: "#fbbf24",
    text: "#1f2937",
    textMuted: "#78350f",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#9a3412",
    attackText: "#1f2937",
    energyDot: "#d97706",
    energyDotStroke: "#78350f",
    fullBleedLightText: false,
  },
  Poison: {
    shell: "#7e22ce",
    body: "#c084fc",
    bodyLight: "#d8b4fe",
    bodyDark: "#a855f7",
    border: "#9333ea",
    artFrame: "#a855f7",
    subtitleBar: "#e9d5ff",
    text: "#1f2937",
    textMuted: "#581c87",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#7e22ce",
    attackText: "#1f2937",
    energyDot: "#a855f7",
    energyDotStroke: "#581c87",
    fullBleedLightText: false,
  },
  Ground: {
    shell: "#92400e",
    body: "#d4a574",
    bodyLight: "#e8c9a0",
    bodyDark: "#b8860b",
    border: "#a16207",
    artFrame: "#ca8a04",
    subtitleBar: "#fcd34d",
    text: "#1f2937",
    textMuted: "#78350f",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#92400e",
    attackText: "#1f2937",
    energyDot: "#ca8a04",
    energyDotStroke: "#78350f",
    fullBleedLightText: false,
  },
  Flying: {
    shell: "#7c8db5",
    body: "#e0e7ff",
    bodyLight: "#eef2ff",
    bodyDark: "#c7d2fe",
    border: "#818cf8",
    artFrame: "#a5b4fc",
    subtitleBar: "#ddd6fe",
    text: "#1f2937",
    textMuted: "#4338ca",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#6366f1",
    attackText: "#1f2937",
    energyDot: "#818cf8",
    energyDotStroke: "#3730a3",
    fullBleedLightText: false,
  },
  Psychic: {
    shell: "#7c3aed",
    body: "#c084fc",
    bodyLight: "#d8b4fe",
    bodyDark: "#a855f7",
    border: "#9333ea",
    artFrame: "#a855f7",
    subtitleBar: "#e9d5ff",
    text: "#1f2937",
    textMuted: "#581c87",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#7e22ce",
    attackText: "#1f2937",
    energyDot: "#a855f7",
    energyDotStroke: "#581c87",
    fullBleedLightText: false,
  },
  Bug: {
    shell: "#4d7c0f",
    body: "#a3e635",
    bodyLight: "#bef264",
    bodyDark: "#84cc16",
    border: "#65a30d",
    artFrame: "#84cc16",
    subtitleBar: "#d9f99d",
    text: "#1f2937",
    textMuted: "#365314",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#4d7c0f",
    attackText: "#1f2937",
    energyDot: "#84cc16",
    energyDotStroke: "#365314",
    fullBleedLightText: false,
  },
  Rock: {
    shell: "#78716c",
    body: "#d6d3d1",
    bodyLight: "#e7e5e4",
    bodyDark: "#a8a29e",
    border: "#78716c",
    artFrame: "#a8a29e",
    subtitleBar: "#d6d3d1",
    text: "#1f2937",
    textMuted: "#57534e",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#57534e",
    attackText: "#1f2937",
    energyDot: "#a8a29e",
    energyDotStroke: "#44403c",
    fullBleedLightText: false,
  },
  Ghost: {
    shell: "#4338ca",
    body: "#818cf8",
    bodyLight: "#a5b4fc",
    bodyDark: "#6366f1",
    border: "#4f46e5",
    artFrame: "#6366f1",
    subtitleBar: "#c7d2fe",
    text: "#1e1b4b",
    textMuted: "#312e81",
    hp: "#fca5a5",
    abilityBg: "#4f46e5",
    abilityLabel: "#ffffff",
    attackLine: "#4338ca",
    attackText: "#1e1b4b",
    energyDot: "#6366f1",
    energyDotStroke: "#312e81",
    fullBleedLightText: true,
  },
  Dragon: {
    shell: "#4338ca",
    body: "#a5b4fc",
    bodyLight: "#c7d2fe",
    bodyDark: "#818cf8",
    border: "#6366f1",
    artFrame: "#818cf8",
    subtitleBar: "#ddd6fe",
    text: "#1e1b4b",
    textMuted: "#3730a3",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#4338ca",
    attackText: "#1e1b4b",
    energyDot: "#6366f1",
    energyDotStroke: "#312e81",
    fullBleedLightText: false,
  },
  Dark: {
    shell: "#0f172a",
    body: "#334155",
    bodyLight: "#475569",
    bodyDark: "#1e293b",
    border: "#1e293b",
    artFrame: "#475569",
    subtitleBar: "#64748b",
    text: "#f8fafc",
    textMuted: "#cbd5e1",
    hp: "#fca5a5",
    abilityBg: "#7f1d1d",
    abilityLabel: "#ffffff",
    attackLine: "#94a3b8",
    attackText: "#f8fafc",
    energyDot: "#64748b",
    energyDotStroke: "#1e293b",
    fullBleedLightText: true,
  },
  Steel: {
    shell: "#64748b",
    body: "#e2e8f0",
    bodyLight: "#f1f5f9",
    bodyDark: "#cbd5e1",
    border: "#94a3b8",
    artFrame: "#94a3b8",
    subtitleBar: "#e2e8f0",
    text: "#1f2937",
    textMuted: "#475569",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#64748b",
    attackText: "#1f2937",
    energyDot: "#94a3b8",
    energyDotStroke: "#334155",
    fullBleedLightText: false,
  },
  Fairy: {
    shell: "#db2777",
    body: "#f9a8d4",
    bodyLight: "#fbcfe8",
    bodyDark: "#f472b6",
    border: "#ec4899",
    artFrame: "#f472b6",
    subtitleBar: "#fce7f3",
    text: "#1f2937",
    textMuted: "#9d174d",
    hp: "#b91c1c",
    abilityBg: "#b91c1c",
    abilityLabel: "#ffffff",
    attackLine: "#be185d",
    attackText: "#1f2937",
    energyDot: "#ec4899",
    energyDotStroke: "#9d174d",
    fullBleedLightText: false,
  },
};

export const POKEMON_TYPE_INFO: Record<PokemonType, PokemonTypeInfo> = {
  Normal: { nameEn: "Normal", nameFr: "Normal", symbol: "◯", color: [168, 168, 160], cssClass: "colorless" },
  Fire: { nameEn: "Fire", nameFr: "Feu", symbol: "🔥", color: [239, 68, 68], cssClass: "fire" },
  Water: { nameEn: "Water", nameFr: "Eau", symbol: "💧", color: [59, 130, 246], cssClass: "water" },
  Grass: { nameEn: "Grass", nameFr: "Plante", symbol: "🌿", color: [34, 197, 94], cssClass: "grass" },
  Electric: { nameEn: "Electric", nameFr: "Électrik", symbol: "⚡", color: [250, 204, 21], cssClass: "lightning" },
  Ice: { nameEn: "Ice", nameFr: "Glace", symbol: "❄️", color: [125, 211, 252], cssClass: "water" },
  Fighting: { nameEn: "Fighting", nameFr: "Combat", symbol: "👊", color: [180, 83, 9], cssClass: "fighting" },
  Poison: { nameEn: "Poison", nameFr: "Poison", symbol: "☠️", color: [168, 85, 247], cssClass: "psychic" },
  Ground: { nameEn: "Ground", nameFr: "Sol", symbol: "🏔️", color: [180, 130, 70], cssClass: "fighting" },
  Flying: { nameEn: "Flying", nameFr: "Vol", symbol: "🪶", color: [147, 197, 253], cssClass: "colorless" },
  Psychic: { nameEn: "Psychic", nameFr: "Psy", symbol: "🔮", color: [168, 85, 247], cssClass: "psychic" },
  Bug: { nameEn: "Bug", nameFr: "Insecte", symbol: "🐛", color: [132, 204, 57], cssClass: "grass" },
  Rock: { nameEn: "Rock", nameFr: "Roche", symbol: "🪨", color: [168, 145, 86], cssClass: "metal" },
  Ghost: { nameEn: "Ghost", nameFr: "Spectre", symbol: "👻", color: [107, 70, 193], cssClass: "darkness" },
  Dragon: { nameEn: "Dragon", nameFr: "Dragon", symbol: "🐉", color: [79, 70, 229], cssClass: "dragon" },
  Dark: { nameEn: "Dark", nameFr: "Ténèbres", symbol: "🌑", color: [75, 85, 99], cssClass: "darkness" },
  Steel: { nameEn: "Steel", nameFr: "Acier", symbol: "⚙️", color: [148, 163, 184], cssClass: "metal" },
  Fairy: { nameEn: "Fairy", nameFr: "Fée", symbol: "✨", color: [236, 72, 153], cssClass: "fairy" },
};

/**
 * Cumulative letter ranges (a→z). Rare types sit on the last letters;
 * Fairy is rarest and reserved for z.
 */
const LETTER_RANGES: { max: string; type: PokemonType }[] = [
  { max: "b", type: "Fire" }, // a-b
  { max: "d", type: "Water" }, // c-d
  { max: "f", type: "Grass" }, // e-f
  { max: "h", type: "Electric" }, // g-h
  { max: "i", type: "Normal" }, // i
  { max: "k", type: "Fighting" }, // j-k
  { max: "l", type: "Poison" }, // l
  { max: "m", type: "Ground" }, // m
  { max: "o", type: "Flying" }, // n-o
  { max: "q", type: "Psychic" }, // p-q
  { max: "r", type: "Bug" }, // r
  { max: "t", type: "Rock" }, // s-t
  { max: "u", type: "Ice" }, // u
  { max: "v", type: "Ghost" }, // v
  { max: "w", type: "Dark" }, // w — rare
  { max: "x", type: "Steel" }, // x — rare
  { max: "y", type: "Dragon" }, // y — rare
  { max: "z", type: "Fairy" }, // z — rarest
];

export function pokemonTypeFromUsername(username: string): PokemonType {
  const clean = username.trim().replace(/^@/, "");
  const letter = (clean[0] ?? "a").toLowerCase();
  if (!/[a-z]/.test(letter)) return "Normal";

  for (const range of LETTER_RANGES) {
    if (letter <= range.max) return range.type;
  }
  return "Fairy";
}

export function pokemonTypeInfo(type: PokemonType): PokemonTypeInfo {
  return POKEMON_TYPE_INFO[type];
}

/** English display label for UI and card faces */
export function pokemonTypeLabel(type: PokemonType | string): string {
  const info = POKEMON_TYPE_INFO[type as PokemonType];
  return info?.nameEn ?? "Normal";
}

export function typeCardTheme(type: PokemonType | string): TypeCardTheme {
  return TYPE_CARD_THEMES[type as PokemonType] ?? TYPE_CARD_THEMES.Normal;
}

export function pokemonTypeCssClass(type: PokemonType | string): string {
  const info = POKEMON_TYPE_INFO[type as PokemonType];
  return info?.cssClass ?? "colorless";
}

/** @deprecated Use pokemonTypeInfo — kept for face render helpers */
export function typeColorRgb(type: PokemonType | string): [number, number, number] {
  const info = POKEMON_TYPE_INFO[type as PokemonType];
  return info?.color ?? POKEMON_TYPE_INFO.Normal.color;
}
