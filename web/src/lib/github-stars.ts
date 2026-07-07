import { GITHUB_REPO_SLUG } from "./site";

/** Server data cache TTL for GitHub star count */
export const GITHUB_STARS_REVALIDATE = 300;

export function formatStarCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  }
  if (count >= 10_000) {
    return `${Math.round(count / 1000)}k`;
  }
  if (count >= 1_000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return count.toLocaleString("en-US");
}

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "HuggiMon",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** GitHub stargazers count for the HuggiMon repo */
export async function fetchGitHubStars(options?: {
  fresh?: boolean;
}): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_SLUG}`, {
      ...(options?.fresh
        ? { cache: "no-store" }
        : { next: { revalidate: GITHUB_STARS_REVALIDATE, tags: ["github-stars"] } }),
      headers: githubHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
