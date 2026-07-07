"use client";

import Link from "next/link";
import { PokemonCard } from "@/components/PokemonCard";
import type { HomeShowcaseCard } from "@/lib/home-showcase";

type Props = {
  cards: HomeShowcaseCard[];
};

const LAYER_STYLES = [
  { rotate: -7, x: -18, y: 10, scale: 0.94 },
  { rotate: 4, x: 14, y: 6, scale: 0.97 },
  { rotate: -1.5, x: 0, y: 0, scale: 1 },
] as const;

export function HomeCardStack({ cards }: Props) {
  if (cards.length === 0) return null;

  const layers = cards.slice(0, 3);

  return (
    <div className="hk-home-stack" aria-hidden={false}>
      {layers.map((item, index) => {
        const layer = LAYER_STYLES[Math.min(index, LAYER_STYLES.length - 1)];
        const isFront = index === layers.length - 1;
        const profileHref = `/${encodeURIComponent(item.card.username)}`;

        const card = (
          <PokemonCard
            card={item.card}
            variant={item.variant}
            faceUrl={item.faceUrl}
            faceSrc={item.faceInline}
            preview
            gyroTilt={isFront}
            showcase={isFront}
            introHolo={isFront}
            imagePriority={isFront ? "high" : "low"}
            imageLoading={isFront ? "eager" : "lazy"}
          />
        );

        return (
          <div
            key={item.card.username}
            className={`hk-home-stack__layer${isFront ? " hk-home-stack__layer--front" : ""}`}
            style={{
              zIndex: index + 1,
              transform: `rotate(${layer.rotate}deg) translate(${layer.x}px, ${layer.y}px) scale(${layer.scale})`,
            }}
          >
            {isFront ? (
              <Link
                href={profileHref}
                className="hk-home-stack__link"
                aria-label={`Open ${item.card.displayName}'s trainer card`}
              >
                {card}
              </Link>
            ) : (
              card
            )}
          </div>
        );
      })}
    </div>
  );
}
