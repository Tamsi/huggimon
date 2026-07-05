import Image from "next/image";
import Link from "next/link";
import { miniCardClass, variantForLevel } from "@/lib/card-variant";
import type { FollowerMini } from "@/lib/binder-fetcher";

type Props = { card: FollowerMini };

export function FollowerMiniCard({ card }: Props) {
  const variant = variantForLevel(card.level);
  const shellClass = miniCardClass(variant);
  const stars = "★".repeat(card.stars);
  const initial = (card.username[0] ?? "?").toUpperCase();

  return (
    <Link
      href={`/${encodeURIComponent(card.username)}`}
      className={`hpkm-card ${shellClass}`}
      title={`@${card.username}`}
    >
      <div className="hpkm-inner">
        <div className="hpkm-name-row">
          <span className="hpkm-name">{card.displayName}</span>
          {variant.badge ? (
            <span className="hpkm-badge">{variant.badge}</span>
          ) : null}
        </div>
        <div className="hpkm-meta">
          <span className="hpkm-level">LV {card.level}</span>
          <span className="hpkm-stars">{stars}</span>
        </div>
        <div className="hpkm-art">
          {card.avatarUrl ? (
            <Image
              src={card.avatarUrl}
              alt=""
              width={120}
              height={120}
              className="hpkm-avatar"
              unoptimized
            />
          ) : (
            <span className="hpkm-initial">{initial}</span>
          )}
        </div>
        <div className="hpkm-footer">
          {card.energyCount > 0 ? (
            <span className="hpkm-energy">{"✦".repeat(card.energyCount)}</span>
          ) : (
            <span className="hpkm-energy hpkm-energy-none">–</span>
          )}
          <span className="hpkm-user">@{card.username}</span>
        </div>
      </div>
      {variant.foil ? <div className="hpkm-layer hpkm-holo" aria-hidden /> : null}
    </Link>
  );
}
