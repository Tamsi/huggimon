import type { CardData } from "@/lib/scoring";
import { overall } from "@/lib/scoring";
import type { CardVariant } from "@/lib/card-variant";

type Props = {
  card: CardData;
  variant: CardVariant;
};

function StatBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="hk-stat">
      <div className="hk-stat__row">
        <span className="hk-stat__label">{label}</span>
        <span className="hk-stat__val">{value}</span>
      </div>
      <div className="hk-stat__bar">
        <div className="hk-stat__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ProfileStats({ card, variant }: Props) {
  const o = overall(card.stats);

  const playstyles: string[] = [];
  if (card.totalModels >= 20) playstyles.push("Model smith");
  if (card.totalDatasets >= 10) playstyles.push("Dataset curator");
  if (card.totalSpaces >= 5) playstyles.push("Space builder");
  if (card.totalFollowers >= 500) playstyles.push("Community lead");
  if (card.totalLikes >= 1000) playstyles.push("Liked creator");
  if (playstyles.length === 0) playstyles.push("Rising trainer");

  return (
    <>
      <div>
        <h2 className="hk-dossier__heading">Scouting metrics</h2>
        <p className="hk-dossier__score">{o}</p>
        <p className="hk-dossier__tier">{variant.name} holo tier</p>
      </div>

      <StatBar label="Model" value={card.stats.model} />
      <StatBar label="Data" value={card.stats.data} />
      <StatBar label="Space" value={card.stats.space} />
      <StatBar label="Impact" value={card.stats.impact} />
      <StatBar label="Community" value={card.stats.community} />
      <StatBar label="Docs" value={card.stats.docs} />

      <div className="hk-dossier__section">
        <h3 className="hk-dossier__heading">Skill moves</h3>
        <ul className="hk-dossier__list">
          {card.attacks.map((a) => (
            <li key={a}>⚡ {a}</li>
          ))}
          <li>✦ {card.passive}</li>
        </ul>
      </div>

      <div className="hk-dossier__section">
        <h3 className="hk-dossier__heading">Playstyles</h3>
        <ul className="hk-dossier__chips">
          {playstyles.map((p) => (
            <li key={p} className="hk-dossier__chip">
              {p}
            </li>
          ))}
        </ul>
      </div>

      <dl className="hk-dossier__counts">
        <div className="hk-dossier__count">
          <dt>Models</dt>
          <dd>{card.totalModels}</dd>
        </div>
        <div className="hk-dossier__count">
          <dt>Datasets</dt>
          <dd>{card.totalDatasets}</dd>
        </div>
        <div className="hk-dossier__count">
          <dt>Spaces</dt>
          <dd>{card.totalSpaces}</dd>
        </div>
        <div className="hk-dossier__count">
          <dt>Followers</dt>
          <dd>{card.totalFollowers}</dd>
        </div>
      </dl>
    </>
  );
}
