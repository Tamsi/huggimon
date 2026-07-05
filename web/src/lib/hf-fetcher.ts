const MAX_ITEMS = 200;

export type UserProfile = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  numFollowers: number;
  numFollowing: number;
  numDiscussions: number;
  isPro: boolean;
};

export type RepoItem = {
  id: string;
  likes: number;
  downloads: number;
  tags: string[];
  description: string | null;
  pipelineTag: string | null;
};

export type HfProfileData = {
  user: UserProfile;
  models: RepoItem[];
  datasets: RepoItem[];
  spaces: RepoItem[];
  totalModelLikes: number;
  totalModelDownloads: number;
  totalSpaceLikes: number;
  totalLikes: number;
  totalDownloads: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`User not found on Hugging Face.`);
    throw new Error(`Hugging Face API error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

type OverviewResponse = {
  user: string;
  fullname?: string;
  avatarUrl?: string;
  numFollowers?: number;
  numFollowing?: number;
  isPro?: boolean;
};

type ModelItem = {
  id: string;
  likes?: number;
  downloads?: number;
  tags?: string[];
  description?: string;
  pipeline_tag?: string;
};

type DatasetItem = {
  id: string;
  likes?: number;
  downloads?: number;
  tags?: string[];
  description?: string;
};

type SpaceItem = {
  id: string;
  likes?: number;
  tags?: string[];
  description?: string;
};

export async function fetchHfProfile(username: string): Promise<HfProfileData> {
  const clean = username.trim().replace(/^@/, "");
  if (!clean) throw new Error("Username is required.");

  let overview: OverviewResponse;
  try {
    overview = await fetchJson<OverviewResponse>(
      `https://huggingface.co/api/users/${encodeURIComponent(clean)}/overview`,
    );
  } catch {
    throw new Error(`User '${clean}' not found on Hugging Face.`);
  }

  const [modelsRaw, datasetsRaw, spacesRaw] = await Promise.all([
    fetchJson<ModelItem[]>(
      `https://huggingface.co/api/models?author=${encodeURIComponent(clean)}&limit=${MAX_ITEMS}`,
    ).catch(() => [] as ModelItem[]),
    fetchJson<DatasetItem[]>(
      `https://huggingface.co/api/datasets?author=${encodeURIComponent(clean)}&limit=${MAX_ITEMS}`,
    ).catch(() => [] as DatasetItem[]),
    fetchJson<SpaceItem[]>(
      `https://huggingface.co/api/spaces?author=${encodeURIComponent(clean)}&limit=${MAX_ITEMS}`,
    ).catch(() => [] as SpaceItem[]),
  ]);

  const models: RepoItem[] = modelsRaw.map((m) => ({
    id: m.id,
    likes: m.likes ?? 0,
    downloads: m.downloads ?? 0,
    tags: m.tags ?? [],
    description: m.description ?? null,
    pipelineTag: m.pipeline_tag ?? null,
  }));

  const datasets: RepoItem[] = datasetsRaw.map((d) => ({
    id: d.id,
    likes: d.likes ?? 0,
    downloads: d.downloads ?? 0,
    tags: d.tags ?? [],
    description: d.description ?? null,
    pipelineTag: null,
  }));

  const spaces: RepoItem[] = spacesRaw.map((s) => ({
    id: s.id,
    likes: s.likes ?? 0,
    downloads: 0,
    tags: s.tags ?? [],
    description: s.description ?? null,
    pipelineTag: null,
  }));

  const totalModelLikes = models.reduce((s, m) => s + m.likes, 0);
  const totalModelDownloads = models.reduce((s, m) => s + m.downloads, 0);
  const totalSpaceLikes = spaces.reduce((s, sp) => s + sp.likes, 0);
  const totalLikes =
    totalModelLikes + totalSpaceLikes + datasets.reduce((s, d) => s + d.likes, 0);
  const totalDownloads =
    totalModelDownloads + datasets.reduce((s, d) => s + d.downloads, 0);

  return {
    user: {
      username: overview.user || clean,
      displayName: overview.fullname ?? overview.user ?? clean,
      avatarUrl: overview.avatarUrl ?? null,
      numFollowers: overview.numFollowers ?? 0,
      numFollowing: overview.numFollowing ?? 0,
      numDiscussions: 0,
      isPro: overview.isPro ?? false,
    },
    models,
    datasets,
    spaces,
    totalModelLikes,
    totalModelDownloads,
    totalSpaceLikes,
    totalLikes,
    totalDownloads,
  };
}
