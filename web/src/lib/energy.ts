export type EnergyInfo = {
  name: string;
  symbol: string;
  color: [number, number, number];
};

export const ENERGY_BY_TYPE: Record<string, EnergyInfo> = {
  Code: { name: "Lightning", symbol: "⚡", color: [250, 204, 21] },
  Vision: { name: "Fire", symbol: "🔥", color: [239, 68, 68] },
  Audio: { name: "Water", symbol: "💧", color: [59, 130, 246] },
  NLP: { name: "Psychic", symbol: "🔮", color: [168, 85, 247] },
  Multimodal: { name: "Rainbow", symbol: "🌈", color: [236, 72, 153] },
  Agent: { name: "Metal", symbol: "⚙️", color: [148, 163, 184] },
  Dataset: { name: "Grass", symbol: "🌿", color: [34, 197, 94] },
};

export const COLORLESS: EnergyInfo = {
  name: "Colorless",
  symbol: "✦",
  color: [203, 213, 225],
};

export function energyForType(typeName: string): EnergyInfo {
  return ENERGY_BY_TYPE[typeName] ?? COLORLESS;
}

export function energyCountFromLikes(likes: number): number {
  if (likes <= 0) return 0;
  return Math.min(8, 1 + Math.floor(Math.log2(likes)));
}

export const ENERGY_TYPE_CLASS: Record<string, string> = {
  Fire: "fire",
  Water: "water",
  Lightning: "lightning",
  Grass: "grass",
  Psychic: "psychic",
  Metal: "metal",
  Rainbow: "fairy",
  Colorless: "colorless",
};

export function energyTypeClass(energyName: string): string {
  return ENERGY_TYPE_CLASS[energyName] ?? "colorless";
}
