import { PokemonCard } from "@/components/PokemonCard";
import { ProfileActions } from "@/components/ProfileActions";
import type { CardData } from "@/lib/scoring";
import type { CardVariant } from "@/lib/card-variant";

type Props = {
  card: CardData;
  variant: CardVariant;
  faceUrl: string;
  profileUrl: string;
};

export function ProfileHero({ card, variant, faceUrl, profileUrl }: Props) {
  return (
    <section className="profile-hero" aria-label="My card">
      <div className="profile-hero__card">
        <PokemonCard
          card={card}
          variant={variant}
          faceUrl={faceUrl}
          showcase={false}
        />
      </div>

      <div className="profile-hero__aside">
        <header className="profile-hero__meta">
          <p className="profile-hero__eyebrow">Trainer card</p>
          <h1 className="profile-hero__name">{card.displayName}</h1>
          <p className="profile-hero__handle">@{card.username}</p>
          <ul className="profile-hero__tags">
            <li>LV {card.level}</li>
            <li>{card.type}</li>
            <li>{variant.name}</li>
          </ul>
        </header>

        <ProfileActions
          username={card.username}
          displayName={card.displayName}
          profileUrl={profileUrl}
          faceUrl={faceUrl}
        />
      </div>
    </section>
  );
}
