const HF_THUMB_BASE = "https://cdn-thumbnails.huggingface.co/social-thumbnails";

const REPO_TYPE_PATH: Record<string, string> = {
  model: "models",
  dataset: "datasets",
  space: "spaces",
};

/** Hugging Face auto-generated social thumbnail (model card, dataset, or space). */
export function hfRepoThumbnailUrl(repoName: string, repoType: string): string {
  const segment = REPO_TYPE_PATH[repoType] ?? "models";
  return `${HF_THUMB_BASE}/${segment}/${repoName}.png`;
}
