import Link from "next/link";
import { HuggimonBinder } from "@/components/HuggimonBinder";
import { ProfileHero } from "@/components/ProfileHero";
import type { BinderPageData } from "@/lib/binder-fetcher";
import type { CardData } from "@/lib/scoring";
import type { CardVariant } from "@/lib/card-variant";

type Props = {
  card: CardData;
  variant: CardVariant;
  faceUrl: string;
  profileUrl: string;
  binderPage: BinderPageData;
};

export function ProfileBinder({
  card,
  variant,
  faceUrl,
  profileUrl,
  binderPage,
}: Props) {
  return (
    <div className="profile">
      <ProfileHero
        card={card}
        variant={variant}
        faceUrl={faceUrl}
        profileUrl={profileUrl}
      />

      <section className="profile-binder" aria-labelledby="binder-heading">
        <h2 id="binder-heading" className="profile-binder__title">
          Mon classeur
        </h2>
        <HuggimonBinder card={card} initialPage={binderPage} />
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
