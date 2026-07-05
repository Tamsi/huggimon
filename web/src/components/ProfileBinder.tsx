import Link from "next/link";
import { Suspense } from "react";
import { HuggimonBinder } from "@/components/HuggimonBinder";
import { ProfileHero } from "@/components/ProfileHero";
import { fetchBinderPage } from "@/lib/binder-fetcher";
import type { CardData } from "@/lib/scoring";
import type { CardVariant } from "@/lib/card-variant";

type Props = {
  card: CardData;
  variant: CardVariant;
  faceUrl: string;
  faceInline?: string;
  profileUrl: string;
};

async function BinderSection({ card }: { card: CardData }) {
  const binderPage = await fetchBinderPage(card.username, 0);
  return <HuggimonBinder card={card} initialPage={binderPage} />;
}

function BinderFallback() {
  return (
    <div className="profile-binder__skeleton" aria-hidden>
      <div className="profile-binder__skeleton-sheet" />
    </div>
  );
}

export function ProfileBinder({ card, variant, faceUrl, faceInline, profileUrl }: Props) {
  return (
    <div className="profile">
      <ProfileHero
        card={card}
        variant={variant}
        faceUrl={faceUrl}
        faceInline={faceInline}
        profileUrl={profileUrl}
      />

      <section className="profile-binder" aria-labelledby="binder-heading">
        <h2 id="binder-heading" className="profile-binder__title">
          My binder
        </h2>
        <Suspense fallback={<BinderFallback />}>
          <BinderSection card={card} />
        </Suspense>
      </section>

      <footer className="profile-foot">
        <a
          href={`https://huggingface.co/${card.username}`}
          target="_blank"
          rel="noreferrer"
          className="profile-foot__link"
        >
          Hugging Face profile ↗
        </a>
        <Link href="/" className="profile-foot__link">
          ← Another trainer
        </Link>
      </footer>
    </div>
  );
}
