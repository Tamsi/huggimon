import {
  COLORLESS,
  energyForType,
  energyTypeClass,
  type EnergyInfo,
} from "./energy";

const HF_BASE = "https://huggingface.co";
const POCKETS_PER_PAGE = 9;
const CACHE_TTL_MS = 600_000;

type CacheEntry<T> = { at: number; data: T };
const followersCache = new Map<string, CacheEntry<HfFollowerRaw[]>>();
const likesCache = new Map<string, CacheEntry<HfLikeRaw[]>>();

export type HfFollowerRaw = {
  user: string;
  fullname?: string;
  avatarUrl?: string;
};

export type HfLikeRaw = {
  createdAt?: string;
  repo: { name: string; type: string };
};

export type FollowerMini = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  stars: number;
  energyCount: number;
};

export type LikeEnergyCard = {
  repoName: string;
  repoType: string;
  shortName: string;
  energyName: string;
  energySymbol: string;
  energyClass: string;
  hfUrl: string;
};

export type BinderSlot =
  | { kind: "follower"; card: FollowerMini }
  | { kind: "energy"; card: LikeEnergyCard }
  | { kind: "empty" };

export type BinderPageData = {
  pageIndex: number;
  totalPages: number;
  label: string;
  pageKind: "followers" | "energy";
  totalFollowers: number;
  totalLikes: number;
  slots: BinderSlot[];
};

type OverviewResponse = {
  user?: string;
  fullname?: string;
  avatarUrl?: string;
  numFollowers?: number;
  numModels?: number;
  numDatasets?: number;
  numSpaces?: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Hugging Face API error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function normalizeAvatar(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${HF_BASE}${url}`;
  return url;
}

function cleanUsername(username: string): string {
  return username.trim().replace(/^@/, "");
}

export function computeMiniStats(
  numFollowers: number,
  numModels: number,
  numDatasets: number,
  numSpaces: number,
): { level: number; stars: number; energyCount: number } {
  const miniScore =
    numModels * 4 + numDatasets * 4 + numSpaces * 6 + Math.min(numFollowers, 50);
  const level = Math.max(1, Math.min(100, miniScore));
  let stars = 1;
  if (miniScore >= 90) stars = 4;
  else if (miniScore >= 60) stars = 3;
  else if (miniScore >= 30) stars = 2;
  const energyCount = Math.min(6, Math.floor(Math.log2(numFollowers + 1)));
  return { level, stars, energyCount };
}

async function getFollowers(username: string): Promise<HfFollowerRaw[]> {
  const clean = cleanUsername(username);
  const cached = followersCache.get(clean);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }
  const data = await fetchJson<HfFollowerRaw[]>(
    `${HF_BASE}/api/users/${encodeURIComponent(clean)}/followers`,
  );
  followersCache.set(clean, { at: Date.now(), data });
  return data;
}

async function getLikes(username: string): Promise<HfLikeRaw[]> {
  const clean = cleanUsername(username);
  const cached = likesCache.get(clean);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }
  const data = await fetchJson<HfLikeRaw[]>(
    `${HF_BASE}/api/users/${encodeURIComponent(clean)}/likes`,
  );
  likesCache.set(clean, { at: Date.now(), data });
  return data;
}

async function fetchFollowerOverview(username: string): Promise<OverviewResponse | null> {
  try {
    return await fetchJson<OverviewResponse>(
      `${HF_BASE}/api/users/${encodeURIComponent(username)}/overview`,
    );
  } catch {
    return null;
  }
}

export async function buildFollowerMini(
  raw: HfFollowerRaw,
  overview?: OverviewResponse | null,
): Promise<FollowerMini> {
  const username = raw.user;
  let displayName = raw.fullname || username;
  let avatarUrl = normalizeAvatar(raw.avatarUrl);
  let numFollowers = 0;
  let numModels = 0;
  let numDatasets = 0;
  let numSpaces = 0;

  const ov = overview ?? (await fetchFollowerOverview(username));
  if (ov) {
    displayName = ov.fullname || displayName;
    avatarUrl = normalizeAvatar(ov.avatarUrl) ?? avatarUrl;
    numFollowers = ov.numFollowers ?? 0;
    numModels = ov.numModels ?? 0;
    numDatasets = ov.numDatasets ?? 0;
    numSpaces = ov.numSpaces ?? 0;
  }

  const { level, stars, energyCount } = computeMiniStats(
    numFollowers,
    numModels,
    numDatasets,
    numSpaces,
  );

  return {
    username,
    displayName,
    avatarUrl,
    level,
    stars,
    energyCount,
  };
}

function energyForRepoType(repoType: string): EnergyInfo {
  switch (repoType) {
    case "model":
      return energyForType("NLP");
    case "space":
      return energyForType("Code");
    case "dataset":
      return energyForType("Dataset");
    case "kernel":
      return energyForType("Agent");
    default:
      return COLORLESS;
  }
}

export function likeToEnergyCard(like: HfLikeRaw): LikeEnergyCard {
  const repoName = like.repo.name;
  const shortName = repoName.split("/").pop() ?? repoName;
  const energy = energyForRepoType(like.repo.type);
  return {
    repoName,
    repoType: like.repo.type,
    shortName,
    energyName: energy.name,
    energySymbol: energy.symbol,
    energyClass: energyTypeClass(energy.name),
    hfUrl: `${HF_BASE}/${repoName}`,
  };
}

function padSlots(slots: BinderSlot[]): BinderSlot[] {
  const out = [...slots];
  while (out.length < POCKETS_PER_PAGE) out.push({ kind: "empty" });
  return out.slice(0, POCKETS_PER_PAGE);
}

function pageLabel(
  pageKind: "followers" | "energy",
  pageIndex: number,
  subIndex: number,
): string {
  if (pageKind === "followers") {
    return subIndex === 0 ? "Followers" : `Followers · ${subIndex + 1}`;
  }
  return subIndex === 0 ? "Energy · Likes" : `Energy · Likes ${subIndex + 1}`;
}

export async function fetchBinderPage(
  username: string,
  pageIndex: number,
): Promise<BinderPageData> {
  const clean = cleanUsername(username);
  const [followers, likes] = await Promise.all([
    getFollowers(clean),
    getLikes(clean),
  ]);

  const followerPages =
    followers.length > 0 ? Math.ceil(followers.length / POCKETS_PER_PAGE) : 0;
  const energyPages =
    likes.length > 0 ? Math.ceil(likes.length / POCKETS_PER_PAGE) : 0;
  const totalPages = Math.max(1, followerPages + energyPages);
  const safeIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));

  if (safeIndex < followerPages) {
    const start = safeIndex * POCKETS_PER_PAGE;
    const batch = followers.slice(start, start + POCKETS_PER_PAGE);
    const cards = await Promise.all(batch.map((f) => buildFollowerMini(f)));
    const slots = padSlots(cards.map((c) => ({ kind: "follower" as const, card: c })));
    return {
      pageIndex: safeIndex,
      totalPages,
      label: pageLabel("followers", safeIndex, safeIndex),
      pageKind: "followers",
      totalFollowers: followers.length,
      totalLikes: likes.length,
      slots,
    };
  }

  const energyIndex = safeIndex - followerPages;
  const start = energyIndex * POCKETS_PER_PAGE;
  const batch = likes.slice(start, start + POCKETS_PER_PAGE);
  const cards = batch.map(likeToEnergyCard);
  const slots = padSlots(cards.map((c) => ({ kind: "energy" as const, card: c })));

  return {
    pageIndex: safeIndex,
    totalPages,
    label: pageLabel("energy", safeIndex, energyIndex),
    pageKind: "energy",
    totalFollowers: followers.length,
    totalLikes: likes.length,
    slots,
  };
}
