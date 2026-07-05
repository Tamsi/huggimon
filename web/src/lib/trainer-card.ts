/** Pokémon TCG Trainer subtypes for liked Hugging Face repos */

export type TrainerSubtype = "item" | "supporter" | "stadium";

export type TrainerCardTheme = {
  subtype: TrainerSubtype;
  subtypeLabel: string;
  cssClass: TrainerSubtype;
  effectText: string;
  ruleText: string;
};

const TRAINER_BY_REPO_TYPE: Record<string, TrainerCardTheme> = {
  model: {
    subtype: "item",
    subtypeLabel: "Item",
    cssClass: "item",
    effectText:
      "Search your Hugging Face for a Model card, reveal it, and put it into your hand. Shuffle your likes afterward.",
    ruleText: "You may play any number of Item cards during your turn.",
  },
  dataset: {
    subtype: "stadium",
    subtypeLabel: "Stadium",
    cssClass: "stadium",
    effectText:
      "Once during each turn, a player may draw 1 card from this Dataset. This card stays in play when played.",
    ruleText: "A Stadium stays in play until a new Stadium comes into play.",
  },
  space: {
    subtype: "supporter",
    subtypeLabel: "Supporter",
    cssClass: "supporter",
    effectText:
      "Draw 3 cards from your collection. If this Space has a demo, you may peek at the top card of your deck.",
    ruleText: "You may play only 1 Supporter card during your turn.",
  },
};

const DEFAULT_TRAINER = TRAINER_BY_REPO_TYPE.model;

export function trainerThemeForRepo(repoType: string): TrainerCardTheme {
  return TRAINER_BY_REPO_TYPE[repoType] ?? DEFAULT_TRAINER;
}

export function trainerCardName(repoName: string): string {
  const short = repoName.split("/").pop() ?? repoName;
  return short.length > 22 ? `${short.slice(0, 20)}…` : short;
}

export function trainerOwner(repoName: string): string {
  return repoName.split("/")[0] ?? repoName;
}
