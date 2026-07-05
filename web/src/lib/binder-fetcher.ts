import {
  trainerCardName,
  trainerOwner,
  trainerThemeForRepo,
} from "./trainer-card";
import { hfRepoThumbnailUrl } from "./repo-thumbnail";

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

/** Lightweight follower ref — full card loads client-side when visible */
export type FollowerRef = {
  username: string;
  displayName: string;
};

export type LikeTrainerCard = {
  repoName: string;
  repoType: string;
  shortName: string;
  displayName: string;
  owner: string;
  subtypeLabel: string;
  trainerClass: string;
  effectText: string;
  ruleText: string;
  artUrl: string;
  hfUrl: string;
};

export type BinderSlot =
  | { kind: "follower"; follower: FollowerRef }
  | { kind: "trainer"; card: LikeTrainerCard }
  | { kind: "empty" };

export type BinderPageData = {
  pageIndex: number;
  totalPages: number;
  label: string;
  pageKind: "followers" | "trainers";
  totalFollowers: number;
  totalLikes: number;
  slots: BinderSlot[];
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

function cleanUsername(username: string): string {
  return username.trim().replace(/^@/, "");
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

function followerRef(raw: HfFollowerRaw): FollowerRef {
  return {
    username: raw.user,
    displayName: raw.fullname || raw.user,
  };
}

export function likeToTrainerCard(like: HfLikeRaw): LikeTrainerCard {
  const repoName = like.repo.name;
  const shortName = repoName.split("/").pop() ?? repoName;
  const theme = trainerThemeForRepo(like.repo.type);
  return {
    repoName,
    repoType: like.repo.type,
    shortName,
    displayName: trainerCardName(repoName),
    owner: trainerOwner(repoName),
    subtypeLabel: theme.subtypeLabel,
    trainerClass: theme.cssClass,
    effectText: theme.effectText,
    ruleText: theme.ruleText,
    artUrl: hfRepoThumbnailUrl(repoName, like.repo.type),
    hfUrl: `${HF_BASE}/${repoName}`,
  };
}

function padSlots(slots: BinderSlot[]): BinderSlot[] {
  const out = [...slots];
  while (out.length < POCKETS_PER_PAGE) out.push({ kind: "empty" });
  return out.slice(0, POCKETS_PER_PAGE);
}

function pageLabel(
  pageKind: "followers" | "trainers",
  _pageIndex: number,
  subIndex: number,
): string {
  if (pageKind === "followers") {
    return subIndex === 0 ? "Followers" : `Followers · ${subIndex + 1}`;
  }
  return subIndex === 0 ? "Trainer · Likes" : `Trainer · Likes ${subIndex + 1}`;
}

/** Page metadata + slot refs only — no per-follower HF profile fetch */
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
  const trainerPages =
    likes.length > 0 ? Math.ceil(likes.length / POCKETS_PER_PAGE) : 0;
  const totalPages = Math.max(1, followerPages + trainerPages);
  const safeIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));

  if (safeIndex < followerPages) {
    const start = safeIndex * POCKETS_PER_PAGE;
    const batch = followers.slice(start, start + POCKETS_PER_PAGE);
    const slots = padSlots(
      batch.map((f) => ({ kind: "follower" as const, follower: followerRef(f) })),
    );
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

  const trainerIndex = safeIndex - followerPages;
  const start = trainerIndex * POCKETS_PER_PAGE;
  const batch = likes.slice(start, start + POCKETS_PER_PAGE);
  const slots = padSlots(
    batch.map((c) => ({ kind: "trainer" as const, card: likeToTrainerCard(c) })),
  );

  return {
    pageIndex: safeIndex,
    totalPages,
    label: pageLabel("trainers", safeIndex, trainerIndex),
    pageKind: "trainers",
    totalFollowers: followers.length,
    totalLikes: likes.length,
    slots,
  };
}
