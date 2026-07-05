import type { HfProfileData } from "./hf-fetcher";
import { energyCountFromLikes, energyForType } from "./energy";

const MAX_STAT = 100;

const TYPE_TAGS: Record<string, string[]> = {
  Code: ["code", "codegen", "programming", "codet5", "codebert", "starcoder"],
  Vision: ["vision", "image-classification", "object-detection", "diffusers", "image-to-text", "text-to-image"],
  Audio: ["audio", "speech", "automatic-speech-recognition", "text-to-speech", "voice-activity-detection"],
  NLP: ["nlp", "text-classification", "token-classification", "question-answering", "summarization", "translation"],
  Multimodal: ["multimodal", "image-to-text", "text-to-image", "visual-question-answering"],
  Agent: ["agent", "smolagents", "tool", "autonomous", "grpo"],
  Dataset: [],
};

export type CardStats = {
  model: number;
  data: number;
  space: number;
  impact: number;
  community: number;
  docs: number;
};

export type CardData = {
  username: string;
  displayName: string;
  level: number;
  type: string;
  rarity: string;
  stats: CardStats;
  attacks: string[];
  passive: string;
  evolution: string;
  totalModels: number;
  totalDatasets: number;
  totalSpaces: number;
  totalFollowers: number;
  totalDownloads: number;
  totalLikes: number;
  energyName: string;
  energySymbol: string;
  energyCount: number;
  avatarUrl: string | null;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(MAX_STAT, Math.round(value)));
}

export function overall(stats: CardStats): number {
  return Math.round(
    (stats.model + stats.data + stats.space + stats.impact + stats.community + stats.docs) / 6,
  );
}

function scoreModel(data: HfProfileData): number {
  const models = data.models.length;
  const likes = data.totalModelLikes;
  const downloads = data.totalModelDownloads;
  return clamp(models * 4 + Math.log1p(likes) * 5 + Math.log1p(downloads) * 1.5);
}

function scoreData(data: HfProfileData): number {
  const datasets = data.datasets.length;
  const likes = data.datasets.reduce((s, d) => s + d.likes, 0);
  const downloads = data.datasets.reduce((s, d) => s + d.downloads, 0);
  return clamp(datasets * 8 + Math.log1p(likes) * 3 + Math.log1p(downloads) * 1.2);
}

function scoreSpace(data: HfProfileData): number {
  const spaces = data.spaces.length;
  const likes = data.totalSpaceLikes;
  return clamp(spaces * 9 + Math.log1p(likes) * 6);
}

function scoreImpact(data: HfProfileData): number {
  return clamp(Math.log1p(data.totalLikes) * 8 + Math.log1p(data.totalDownloads) * 2.5);
}

function scoreCommunity(data: HfProfileData): number {
  const followers = data.user.numFollowers;
  const discussions = data.user.numDiscussions;
  return clamp(followers * 0.8 + discussions * 2 + Math.log1p(followers) * 5);
}

function scoreDocs(data: HfProfileData): number {
  const allRepos = [...data.models, ...data.datasets, ...data.spaces];
  if (!allRepos.length) return 0;
  const withDescription = allRepos.filter((r) => r.description).length;
  return clamp((withDescription / allRepos.length) * 80 + Math.log1p(allRepos.length) * 5);
}

export function computeStats(data: HfProfileData): CardStats {
  return {
    model: scoreModel(data),
    data: scoreData(data),
    space: scoreSpace(data),
    impact: scoreImpact(data),
    community: scoreCommunity(data),
    docs: scoreDocs(data),
  };
}

function detectType(data: HfProfileData, stats: CardStats): string {
  const tagCounts: Record<string, number> = Object.fromEntries(
    Object.keys(TYPE_TAGS).map((t) => [t, 0]),
  );

  for (const repo of [...data.models, ...data.datasets, ...data.spaces]) {
    for (const tag of repo.tags) {
      const lower = tag.toLowerCase();
      for (const [t, keywords] of Object.entries(TYPE_TAGS)) {
        if (keywords.some((k) => lower.includes(k))) tagCounts[t] += 1;
      }
    }
  }

  if (data.datasets.length > data.models.length + data.spaces.length && stats.data >= stats.model) {
    return "Dataset";
  }

  const best = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] > 0) return best[0];
  return stats.model >= stats.data ? "Code" : "NLP";
}

function rarityFromOverall(o: number): string {
  if (o >= 90) return "Legendary";
  if (o >= 75) return "Epic";
  if (o >= 55) return "Rare";
  return "Common";
}

function moves(typeName: string, stats: CardStats): { attacks: string[]; passive: string; evolution: string } {
  const priority: [string, number][] = [
    ["Model Overload", stats.model],
    ["Dataset Tsunami", stats.data],
    ["Space Storm", stats.space],
  ];
  priority.sort((a, b) => b[1] - a[1]);
  const attacks = priority.slice(0, 2).map(([name]) => name);

  const passiveMap: Record<string, string> = {
    Code: "Open Source Aura",
    Vision: "Pixel Precision",
    Audio: "Wave Resonance",
    NLP: "Token Mastery",
    Multimodal: "Fusion Core",
    Agent: "Toolformer Soul",
    Dataset: "Data Curator",
  };

  const o = overall(stats);
  let evolution = "Contributor";
  if (o >= 90) evolution = "Contributor → Builder → Hub Legend";
  else if (o >= 75) evolution = "Contributor → Builder → Architect";
  else if (o >= 55) evolution = "Contributor → Builder";

  return { attacks, passive: passiveMap[typeName] ?? "Hub Spirit", evolution };
}

function normalizeAvatar(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `https://huggingface.co${url}`;
  return url;
}

export function buildCard(data: HfProfileData): CardData {
  const stats = computeStats(data);
  const o = overall(stats);
  const typeName = detectType(data, stats);
  const { attacks, passive, evolution } = moves(typeName, stats);
  const energy = energyForType(typeName);

  return {
    username: data.user.username,
    displayName: data.user.displayName || data.user.username,
    level: Math.max(1, Math.floor(o * 1.2)),
    type: typeName,
    rarity: rarityFromOverall(o),
    stats,
    attacks,
    passive,
    evolution,
    totalModels: data.models.length,
    totalDatasets: data.datasets.length,
    totalSpaces: data.spaces.length,
    totalFollowers: data.user.numFollowers,
    totalDownloads: data.totalDownloads,
    totalLikes: data.totalLikes,
    energyName: energy.name,
    energySymbol: energy.symbol,
    energyCount: energyCountFromLikes(data.totalLikes),
    avatarUrl: normalizeAvatar(data.user.avatarUrl),
  };
}

export function stageLabel(card: CardData): string {
  if (card.evolution.includes("→")) {
    const parts = card.evolution.split("→").map((s) => s.trim());
    if (parts.length >= 3) return "Stage 2";
    return "Stage 1";
  }
  return "Basic";
}

export function hpValue(card: CardData): number {
  return Math.min(340, 60 + card.level * 2);
}

export function attackRows(card: CardData): [string, number, number][] {
  const [a1, a2] = card.attacks;
  const costs: [number, number, number] = [card.stats.model, card.stats.data, card.stats.space];
  costs.sort((x, y) => y - x);
  return [
    [a1, Math.max(10, costs[0]), Math.min(4, Math.max(1, Math.ceil(costs[0] / 30)))],
    [a2, Math.max(10, costs[1]), Math.min(4, Math.max(1, Math.ceil(costs[1] / 30)))],
  ];
}
