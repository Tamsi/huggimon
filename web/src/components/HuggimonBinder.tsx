"use client";

import { useCallback, useEffect, useState } from "react";
import { EnergyMiniCard } from "@/components/EnergyMiniCard";
import { FollowerMiniCard } from "@/components/FollowerMiniCard";
import type { BinderPageData, BinderSlot } from "@/lib/binder-fetcher";
import type { CardData } from "@/lib/scoring";

type Props = {
  card: CardData;
  initialPage: BinderPageData;
};

function PocketSlot({ slot }: { slot: BinderSlot }) {
  return (
    <div
      className={`tcg-pocket${slot.kind !== "empty" ? " tcg-pocket--filled" : ""}`}
    >
      <div className="tcg-pocket__plastic">
        <div className="tcg-pocket__well">
          {slot.kind === "follower" ? (
            <FollowerMiniCard card={slot.card} />
          ) : slot.kind === "energy" ? (
            <EnergyMiniCard card={slot.card} />
          ) : (
            <div className="tcg-pocket__back" aria-hidden />
          )}
        </div>
        <div className="tcg-pocket__shine" aria-hidden />
      </div>
    </div>
  );
}

function PocketGrid({ slots }: { slots: BinderSlot[] }) {
  return (
    <div className="tcg-page__grid">
      {slots.map((slot, i) => (
        <PocketSlot key={i} slot={slot} />
      ))}
    </div>
  );
}

export function HuggimonBinder({ card, initialPage }: Props) {
  const [opened, setOpened] = useState(false);
  const [pageData, setPageData] = useState<BinderPageData>(initialPage);
  const [page, setPage] = useState(initialPage.pageIndex);
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);
  const [loading, setLoading] = useState(false);

  const pageCount = pageData.totalPages;

  useEffect(() => {
    if (!opened) return;
    if (page === pageData.pageIndex) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/binder/${encodeURIComponent(card.username)}?page=${page}`,
        );
        if (res.ok && !cancelled) {
          setPageData((await res.json()) as BinderPageData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, opened, card.username, pageData.pageIndex]);

  const openBinder = useCallback(() => {
    if (!opened) setOpened(true);
  }, [opened]);

  const turn = useCallback(
    (dir: "next" | "prev") => {
      if (turning || !opened || loading) return;
      const next = dir === "next" ? page + 1 : page - 1;
      if (next < 0 || next >= pageCount) return;

      if (dir === "prev") {
        setPage(next);
        return;
      }

      setTurning("next");
      window.setTimeout(() => {
        setPage(next);
        setTurning(null);
      }, 650);
    },
    [turning, opened, page, pageCount, loading],
  );

  const statsLine =
    pageData.totalFollowers > 0 || pageData.totalLikes > 0
      ? `${pageData.totalFollowers} followers · ${pageData.totalLikes} likes`
      : "Empty collection";

  return (
    <div className="tcg-binder-stage">
      <div
        className={`tcg-binder${opened ? " tcg-binder--open" : ""}${turning === "next" ? " tcg-binder--turn-next" : ""}`}
      >
        <button
          type="button"
          className="tcg-binder__cover"
          onClick={openBinder}
          aria-label={opened ? "Classeur ouvert" : "Ouvrir le classeur HuggiMon"}
          disabled={opened}
        >
          <div className="tcg-binder__cover-face">
            <div className="tcg-binder__cover-frame" aria-hidden />
            <div className="tcg-binder__cover-medallion" aria-hidden>
              H
            </div>
            <p className="tcg-binder__cover-brand">HuggiMon</p>
            <p className="tcg-binder__cover-tagline">Trainer Collection</p>
            <p className="tcg-binder__cover-user">@{card.username}</p>
            {!opened && (
              <span className="tcg-binder__cover-cta">Ouvrir le classeur</span>
            )}
          </div>
          <div className="tcg-binder__cover-inside" aria-hidden />
        </button>

        <div className="tcg-binder__body">
          <div className="tcg-binder__spine" aria-hidden>
            <span className="tcg-binder__spine-text">HuggiMon</span>
          </div>

          <div className="tcg-binder__rings" aria-hidden>
            <span className="tcg-binder__ring" />
            <span className="tcg-binder__ring" />
            <span className="tcg-binder__ring" />
          </div>

          <div className="tcg-binder__stack">
            {page < pageCount - 1 && (
              <div className="tcg-binder__sheet tcg-binder__sheet--under" aria-hidden />
            )}
            {page < pageCount - 2 && (
              <div
                className="tcg-binder__sheet tcg-binder__sheet--under-2"
                aria-hidden
              />
            )}

            <div
              className={`tcg-binder__sheet tcg-binder__sheet--active${turning === "next" ? " tcg-binder__sheet--flip-next" : ""}${loading ? " tcg-binder__sheet--loading" : ""}`}
            >
              <div className="tcg-page">
                <header className="tcg-page__head">
                  <span className="tcg-page__num">
                    Page {page + 1}/{pageCount}
                  </span>
                  <span className="tcg-page__label">{pageData.label}</span>
                  <span className="tcg-page__stats">{statsLine}</span>
                </header>
                <PocketGrid slots={pageData.slots} />
              </div>
              <div className="tcg-page tcg-page--rear" aria-hidden>
                <div className="tcg-page__rear-fill" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {opened && (
        <div className="tcg-binder__controls">
          <button
            type="button"
            className="tcg-binder__nav"
            onClick={() => turn("prev")}
            disabled={page === 0 || turning !== null || loading}
            aria-label="Page précédente"
          >
            ‹
          </button>
          <div className="tcg-binder__dots">
            {Array.from({ length: pageCount }, (_, i) => (
              <span
                key={i}
                className={`tcg-binder__dot${i === page ? " tcg-binder__dot--on" : ""}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="tcg-binder__nav"
            onClick={() => turn("next")}
            disabled={page === pageCount - 1 || turning !== null || loading}
            aria-label="Page suivante"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
