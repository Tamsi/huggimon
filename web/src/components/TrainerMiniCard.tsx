"use client";

import { useState } from "react";
import type { LikeTrainerCard } from "@/lib/binder-fetcher";

type Props = {
  card: LikeTrainerCard;
  interacting?: boolean;
};

function TrainerCardArt({ url, repoType }: { url: string; repoType: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`hpkt-art hpkt-art--${repoType}${failed ? " hpkt-art--fallback" : ""}`}
      aria-hidden
    >
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element -- external HF CDN thumbnail
        <img
          src={url}
          alt=""
          className="hpkt-art__img"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      <span className="hpkt-art__glyph" />
      <span className="hpkt-art__scrim" />
    </div>
  );
}

export function TrainerMiniCard({ card, interacting = false }: Props) {
  return (
    <div className="tcg-pocket__card">
      <div
        className={`hpkt-card hpkt-card--${card.trainerClass}${interacting ? " hpkt-card--interacting" : ""}`}
      >
        <div className="hpkt-card__foil" aria-hidden />
        <div className="hpkt-card__glare" aria-hidden />
        <div className="hpkt-frame">
          <header className="hpkt-header">
            <span className="hpkt-header__label">TRAINER</span>
            <span className="hpkt-header__tab">{card.subtypeLabel}</span>
          </header>

          <h3 className="hpkt-name">{card.displayName}</h3>

          <TrainerCardArt url={card.artUrl} repoType={card.repoType} />

          <div className="hpkt-body">
            <p className="hpkt-effect">{card.effectText}</p>
            <span className="hpkt-rule">{card.ruleText}</span>
          </div>

          <footer className="hpkt-footer">
            <span className="hpkt-footer__owner">@{card.owner}</span>
            <span className="hpkt-footer__kind">{card.repoType}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
