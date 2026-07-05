import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileBinder } from "@/components/ProfileBinder";
import { getCardFacePng } from "@/lib/card-face-cache";
import { variantForLevel } from "@/lib/card-variant";
import { fetchHfProfile } from "@/lib/hf-fetcher";
import { buildCard } from "@/lib/scoring";

type Props = { params: Promise<{ username: string }> };

async function profileUrl(username: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}/${encodeURIComponent(username)}`;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  try {
    const card = buildCard(await fetchHfProfile(username));
    return {
      title: `${card.displayName} — HuggiMon`,
      description: `Level ${card.level} ${card.type} trainer · ${card.rarity} · ${card.energyName} energy`,
      openGraph: {
        title: `${card.displayName} — HuggiMon Trainer Card`,
        description: `LV ${card.level} ${card.type} · ${card.rarity}`,
        images: [`/api/card/${card.username}/face`],
      },
    };
  } catch {
    return { title: "HuggiMon" };
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  let card;
  try {
    card = buildCard(await fetchHfProfile(username));
  } catch {
    notFound();
  }

  const variant = variantForLevel(card.level);
  const faceUrl = `/api/card/${encodeURIComponent(card.username)}/face`;

  const [url, facePng] = await Promise.all([
    profileUrl(card.username),
    getCardFacePng(card.username),
  ]);
  const faceInline = `data:image/png;base64,${facePng.toString("base64")}`;

  return (
    <div className="hk-shell hk-desk hk-body">
      <main className="hk-main">
        <ProfileBinder
          card={card}
          variant={variant}
          faceUrl={faceUrl}
          faceInline={faceInline}
          profileUrl={url}
        />
      </main>
    </div>
  );
}
