import type { LikeEnergyCard } from "@/lib/binder-fetcher";

type Props = { card: LikeEnergyCard };

export function EnergyMiniCard({ card }: Props) {
  return (
    <a
      href={card.hfUrl}
      target="_blank"
      rel="noreferrer"
      className={`hpke-card hpke-card--${card.energyClass}`}
      title={card.repoName}
    >
      <div className="hpke-inner">
        <span className="hpke-type">{card.energyName}</span>
        <div className="hpke-symbol" aria-hidden>
          {card.energySymbol}
        </div>
        <p className="hpke-name">{card.shortName}</p>
        <span className="hpke-repo-type">{card.repoType}</span>
      </div>
    </a>
  );
}
