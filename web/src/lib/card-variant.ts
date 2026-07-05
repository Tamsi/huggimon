/** Face layout templates — each maps to a pre-made overlay + pokemon-cards-css wire attrs */

export type FaceTemplate =
  | "trainer"
  | "pokemon-v"
  | "full-art"
  | "vmax"
  | "rainbow"
  | "vstar"
  | "secret";

export type CardVariant = {
  name: string;
  badge: string;
  dataRarity: string;
  supertype: "trainer" | "pokémon";
  subtypes: string;
  trainerGallery: boolean;
  masked: boolean;
  faceTemplate: FaceTemplate;
  foil?: string;
  mask?: string;
};

const IMG = "/pokemon-cards-css/img";

const COMMON: CardVariant = {
  name: "Common",
  badge: "",
  dataRarity: "common",
  supertype: "trainer",
  subtypes: "supporter",
  trainerGallery: false,
  masked: false,
  faceTemplate: "trainer",
};

const REVERSE_HOLO: CardVariant = {
  name: "Reverse Holo",
  badge: "reverse",
  dataRarity: "uncommon reverse holo",
  supertype: "trainer",
  subtypes: "supporter",
  trainerGallery: false,
  masked: true,
  faceTemplate: "trainer",
  foil: `${IMG}/angular.png`,
  mask: `${IMG}/wave.png`,
};

const HOLO_RARE: CardVariant = {
  name: "Holo Rare",
  badge: "holo",
  dataRarity: "rare holo",
  supertype: "trainer",
  subtypes: "supporter",
  trainerGallery: false,
  masked: false,
  faceTemplate: "trainer",
};

const COSMOS: CardVariant = {
  name: "Cosmos Holo",
  badge: "cosmos",
  dataRarity: "rare holo cosmos",
  supertype: "trainer",
  subtypes: "supporter",
  trainerGallery: false,
  masked: false,
  faceTemplate: "trainer",
};

const AMAZING: CardVariant = {
  name: "Amazing Rare",
  badge: "amazing",
  dataRarity: "amazing rare",
  supertype: "trainer",
  subtypes: "supporter",
  trainerGallery: false,
  masked: true,
  faceTemplate: "trainer",
  foil: `${IMG}/glitter.png`,
  mask: `${IMG}/geometric.png`,
};

const RADIANT: CardVariant = {
  name: "Radiant",
  badge: "radiant",
  dataRarity: "radiant rare",
  supertype: "trainer",
  subtypes: "radiant",
  trainerGallery: false,
  masked: false,
  faceTemplate: "trainer",
};

const TRAINER_GALLERY: CardVariant = {
  name: "Trainer Gallery",
  badge: "TG",
  dataRarity: "rare holo",
  supertype: "trainer",
  subtypes: "supporter",
  trainerGallery: true,
  masked: false,
  faceTemplate: "trainer",
};

const POKEMON_V: CardVariant = {
  name: "Pokemon V",
  badge: "V",
  dataRarity: "rare holo v",
  supertype: "pokémon",
  subtypes: "basic v",
  trainerGallery: false,
  masked: false,
  faceTemplate: "pokemon-v",
};

const V_FULL_ART: CardVariant = {
  name: "V Full Art",
  badge: "V FA",
  dataRarity: "rare ultra",
  supertype: "pokémon",
  subtypes: "basic v",
  trainerGallery: false,
  masked: false,
  faceTemplate: "full-art",
  foil: `${IMG}/illusion.png`,
};

const V_ALT_ART: CardVariant = {
  name: "V Alt Art",
  badge: "V AA",
  dataRarity: "rare ultra",
  supertype: "pokémon",
  subtypes: "basic v",
  trainerGallery: false,
  masked: true,
  faceTemplate: "full-art",
  foil: `${IMG}/illusion.png`,
  mask: `${IMG}/illusion-mask.png`,
};

const VMAX: CardVariant = {
  name: "VMax",
  badge: "VMAX",
  dataRarity: "rare holo vmax",
  supertype: "pokémon",
  subtypes: "vmax",
  trainerGallery: false,
  masked: false,
  faceTemplate: "vmax",
};

const VMAX_RAINBOW: CardVariant = {
  name: "VMax Rainbow",
  badge: "VMAX ★",
  dataRarity: "rare rainbow",
  supertype: "pokémon",
  subtypes: "vmax",
  trainerGallery: false,
  masked: false,
  faceTemplate: "rainbow",
};

const VSTAR: CardVariant = {
  name: "VStar",
  badge: "VSTAR",
  dataRarity: "rare holo vstar",
  supertype: "pokémon",
  subtypes: "vstar",
  trainerGallery: false,
  masked: false,
  faceTemplate: "vstar",
};

const SECRET_GOLD: CardVariant = {
  name: "Secret Gold",
  badge: "★ gold",
  dataRarity: "rare secret",
  supertype: "trainer",
  subtypes: "supporter",
  trainerGallery: false,
  masked: false,
  faceTemplate: "secret",
  foil: `${IMG}/geometric.png`,
};

const THRESHOLDS: [number, CardVariant][] = [
  [94, SECRET_GOLD],
  [87, VSTAR],
  [80, VMAX_RAINBOW],
  [73, VMAX],
  [66, V_ALT_ART],
  [59, V_FULL_ART],
  [52, POKEMON_V],
  [45, TRAINER_GALLERY],
  [38, RADIANT],
  [31, AMAZING],
  [24, COSMOS],
  [17, HOLO_RARE],
  [10, REVERSE_HOLO],
];

export function variantForLevel(level: number): CardVariant {
  for (const [threshold, variant] of THRESHOLDS) {
    if (level >= threshold) return variant;
  }
  return COMMON;
}

/** Mini-card shell class for binder follower pockets */
export function miniCardClass(variant: CardVariant): string {
  const byRarity: Record<string, string> = {
    common: "hpkm-card--common",
    "uncommon reverse holo": "hpkm-card--reverse",
    "rare holo": "hpkm-card--holo",
    "rare holo cosmos": "hpkm-card--cosmos",
    "amazing rare": "hpkm-card--amazing",
    "radiant rare": "hpkm-card--radiant",
    "rare holo v": "hpkm-card--v",
    "rare ultra": "hpkm-card--vfa",
    "rare holo vmax": "hpkm-card--vmax",
    "rare rainbow": "hpkm-card--vmax-r",
    "rare holo vstar": "hpkm-card--vstar",
    "rare secret": "hpkm-card--gold",
  };
  return byRarity[variant.dataRarity] ?? "hpkm-card--common";
}

export function wireSubtypes(variant: CardVariant, stage: string): string {
  if (variant.trainerGallery || variant.subtypes === "radiant") {
    return variant.subtypes;
  }
  if (stage === "Stage 1") return "stage1";
  if (stage === "Stage 2") return "stage2";
  return variant.subtypes || "supporter";
}

export function wireNumber(variant: CardVariant, level: number): string {
  if (variant.trainerGallery) return `TG${String(level).padStart(2, "0")}`;
  return String(level);
}

/** TCG outer frame tier — yellow basics, black V, grey full-art, none for VMAX */
export type CardBorderTier = "basic-yellow" | "v-black" | "full-art-grey" | "none" | "secret-gold";

export function cardBorderTier(variant: CardVariant): CardBorderTier {
  switch (variant.faceTemplate) {
    case "trainer":
      return "basic-yellow";
    case "pokemon-v":
      return "v-black";
    case "vmax":
    case "rainbow":
      return "none";
    case "secret":
      return "secret-gold";
    case "full-art":
    case "vstar":
    default:
      return "full-art-grey";
  }
}

/** CSS root class for holo clipping behaviour */
export function faceLayoutClass(variant: CardVariant): string {
  return variant.faceTemplate === "trainer" ? "hpk-trainer-face" : "hpk-full-bleed";
}
