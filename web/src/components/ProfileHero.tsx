import { PokemonCard } from "@/components/PokemonCard";
import { ProfileActions } from "@/components/ProfileActions";
import { pokemonTypeLabel } from "@/lib/pokemon-types";
import type { CardData } from "@/lib/scoring";
import type { CardVariant } from "@/lib/card-variant";

type Props = {
  card: CardData;
  variant: CardVariant;
  faceUrl: string;
  faceInline?: string;
  profileUrl: string;
};

export function ProfileHero({ card, variant, faceUrl, faceInline, profileUrl }: Props) {
  return (
    <section className="profile-hero" aria-label="My card">
      <div className="profile-hero__card">
        <PokemonCard
          card={card}
          variant={variant}
          faceUrl={faceUrl}
          faceSrc={faceInline}
          imagePriority="high"
          imageLoading="eager"
        />
      </div>

      <div className="profile-hero__aside">
        <header className="profile-hero__meta">
          <p className="profile-hero__eyebrow">Trainer card</p>
          <h1 className="profile-hero__name">{card.displayName}</h1>
          <p className="profile-hero__handle">@{card.username}</p>
          <ul className="profile-hero__tags">
            <li>LV {card.level}</li>
            <li>{pokemonTypeLabel(card.type)}</li>
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
