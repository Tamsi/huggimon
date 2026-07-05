"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

const STATS = [
  {
    name: "Model",
    detail: "Models published, likes & downloads on your checkpoints.",
  },
  {
    name: "Data",
    detail: "Datasets, their engagement, and download volume.",
  },
  {
    name: "Space",
    detail: "Spaces you host and how much traction they get.",
  },
  {
    name: "Impact",
    detail: "Global likes and downloads across your HF profile.",
  },
  {
    name: "Community",
    detail: "Followers, discussions, and social reach.",
  },
  {
    name: "Docs",
    detail: "Repo descriptions and how well your work is documented.",
  },
] as const;

const RARITY_TIERS = [
  { label: "Common", range: "0 – 54", note: "Trainer card" },
  { label: "Rare", range: "55 – 74", note: "Holo & reverse holo" },
  { label: "Epic", range: "75 – 89", note: "V, VMAX, radiant…" },
  { label: "Legendary", range: "90+", note: "Rainbow, gold secret…" },
] as const;

const VARIANT_LEVELS = [
  { level: "10+", variant: "Reverse Holo" },
  { level: "17+", variant: "Holo Rare" },
  { level: "24+", variant: "Cosmos Holo" },
  { level: "38+", variant: "Radiant" },
  { level: "52+", variant: "Pokémon V" },
  { level: "73+", variant: "VMAX" },
  { level: "80+", variant: "VMAX Rainbow" },
  { level: "94+", variant: "Secret Gold" },
] as const;

export function HowItWorksDialog({ open, onClose }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onKeyDown]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="hk-modal" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="hk-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="hk-modal__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path
              fill="currentColor"
              d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.89a1 1 0 0 0 1.42-1.41L13.41 12l4.89-4.89a1 1 0 0 0-.01-1.4z"
            />
          </svg>
        </button>

        <div className="hk-modal__hero">
          <p className="hk-modal__eyebrow">Scoring guide</p>
          <h2 id={titleId} className="hk-modal__title">
            How your card is built
          </h2>
          <p className="hk-modal__lead">
            HuggiMon reads your public Hugging Face profile and turns activity into a Pokémon TCG
            trainer card — stats, level, type, rarity, and holo variant.
          </p>
        </div>

        <div className="hk-modal__body">
          <section className="hk-modal__section">
            <h3 className="hk-modal__section-title">Six stats (0 – 100 each)</h3>
            <p className="hk-modal__section-desc">
              We score six dimensions from your repos, engagement, and profile. The average becomes
              your overall rating.
            </p>
            <ul className="hk-modal__stat-grid">
              {STATS.map((s) => (
                <li key={s.name} className="hk-modal__stat">
                  <span className="hk-modal__stat-name">{s.name}</span>
                  <span className="hk-modal__stat-detail">{s.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="hk-modal__section hk-modal__section--split">
            <div>
              <h3 className="hk-modal__section-title">Level & HP</h3>
              <p className="hk-modal__formula">
                <code>level = max(1, floor(overall × 1.2))</code>
              </p>
              <p className="hk-modal__section-desc">
                HP on the card is derived from level (rounded to the nearest 10, capped at 340).
                Higher overall → higher level → stronger card.
              </p>
            </div>
            <div>
              <h3 className="hk-modal__section-title">Pokémon type</h3>
              <p className="hk-modal__section-desc">
                Your type comes from the <strong>first letter</strong> of your HF username (a–z
                maps to 18 types). Rare letters like <strong>z</strong> can roll Fairy — the
                rarest type.
              </p>
            </div>
          </section>

          <section className="hk-modal__section">
            <h3 className="hk-modal__section-title">Rarity</h3>
            <div className="hk-modal__tiers">
              {RARITY_TIERS.map((t) => (
                <div key={t.label} className="hk-modal__tier">
                  <span className="hk-modal__tier-label">{t.label}</span>
                  <span className="hk-modal__tier-range">{t.range}</span>
                  <span className="hk-modal__tier-note">{t.note}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="hk-modal__section">
            <h3 className="hk-modal__section-title">Card variant (holo tier)</h3>
            <p className="hk-modal__section-desc">
              Level unlocks the card template and holo effect — from a classic yellow trainer card
              up to rainbow VMAX and gold secrets.
            </p>
            <ul className="hk-modal__variant-list">
              {VARIANT_LEVELS.map((v) => (
                <li key={v.variant}>
                  <span className="hk-modal__variant-level">LV {v.level}</span>
                  <span className="hk-modal__variant-name">{v.variant}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="hk-modal__section hk-modal__section--muted">
            <h3 className="hk-modal__section-title">On the card itself</h3>
            <ul className="hk-modal__bullets">
              <li>
                <strong>Attacks</strong> — your two strongest stats (Model / Data / Space) set move
                names, damage, and energy cost.
              </li>
              <li>
                <strong>Ability</strong> — a passive tied to your Pokémon type.
              </li>
              <li>
                <strong>Evolution line</strong> — grows with overall score (Contributor → Builder →
                Architect…).
              </li>
              <li>
                <strong>Binder</strong> — followers appear as mini cards in your collection, sorted
                by their own level.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
