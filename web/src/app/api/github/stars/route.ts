import { fetchGitHubStars, formatStarCount } from "@/lib/github-stars";

export async function GET() {
  const stars = await fetchGitHubStars({ fresh: true });

  return Response.json(
    { stars, label: stars !== null ? formatStarCount(stars) : null },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${300}, stale-while-revalidate=600`,
      },
    },
  );
}
