"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { BinderPocketCard } from "@/components/BinderPocketCard";
import { TrainerPocketCard } from "@/components/TrainerPocketCard";
import { BinderActiveCardProvider } from "@/contexts/binder-active-card";
import type { BinderPageData, BinderSlot } from "@/lib/binder-fetcher";
import type { CardData } from "@/lib/scoring";

type Props = {
  card: CardData;
  initialPage: BinderPageData;
};

function PocketSlot({ slot, binderOpen }: { slot: BinderSlot; binderOpen: boolean }) {
  return (
    <div
      className={`tcg-pocket${slot.kind !== "empty" ? " tcg-pocket--filled" : ""}`}
    >
      <div className="tcg-pocket__plastic">
        <div className="tcg-pocket__well">
          {slot.kind === "follower" ? (
            <BinderPocketCard follower={slot.follower} active={binderOpen} />
          ) : slot.kind === "trainer" ? (
            <TrainerPocketCard card={slot.card} binderOpen={binderOpen} />
          ) : (
            <div className="tcg-pocket__back tcg-card-back" aria-hidden />
          )}
        </div>
        <div className="tcg-pocket__shine" aria-hidden />
      </div>
    </div>
  );
}

function PocketGrid({ slots, binderOpen }: { slots: BinderSlot[]; binderOpen: boolean }) {
  return (
    <BinderActiveCardProvider>
      <div className="tcg-page__grid">
        {slots.map((slot, i) => (
          <PocketSlot
            key={
              slot.kind === "follower"
                ? slot.follower.username
                : slot.kind === "trainer"
                  ? slot.card.repoName
                  : `empty-${i}`
            }
            slot={slot}
            binderOpen={binderOpen}
          />
        ))}
      </div>
    </BinderActiveCardProvider>
  );
}

function BinderPageFace({
  data,
  page,
  pageCount,
  binderOpen,
}: {
  data: BinderPageData;
  page: number;
  pageCount: number;
  binderOpen: boolean;
}) {
  const statsLine =
    data.totalFollowers > 0 || data.totalLikes > 0
      ? `${data.totalFollowers} followers · ${data.totalLikes} likes`
      : "Empty collection";

  return (
    <div className="tcg-page tcg-page--front">
      <header className="tcg-page__head">
        <span className="tcg-page__num">
          Page {page + 1}/{pageCount}
        </span>
        <span className="tcg-page__label">{data.label}</span>
        <span className="tcg-page__stats">{statsLine}</span>
      </header>
      <PocketGrid slots={data.slots} binderOpen={binderOpen} />
    </div>
  );
}

const PAGE_FLIP_MS = 1000;
const GUTTER_PX = 28;

export function HuggimonBinder({ card, initialPage }: Props) {
  const [opened, setOpened] = useState(false);
  const [pageData, setPageData] = useState<BinderPageData>(initialPage);
  const [page, setPage] = useState(initialPage.pageIndex);
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);
  const [loading, setLoading] = useState(false);
  const [sheetPose, setSheetPose] = useState<"rest" | "flipped">("rest");
  const [sheetHinge, setSheetHinge] = useState<"left" | "right">("left");
  const [flipPageData, setFlipPageData] = useState<BinderPageData | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const flipTimerRef = useRef<number | null>(null);

  const pageCount = pageData.totalPages;
  const sheetData = turning === "prev" && flipPageData ? flipPageData : pageData;

  const clearFlipTimer = useCallback(() => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearFlipTimer(), [clearFlipTimer]);

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

  const finishNextTurn = useCallback(
    (nextPage: number) => {
      const sheet = sheetRef.current;
      if (sheet) sheet.classList.add("tcg-binder__sheet--instant");
      setPage(nextPage);
      setSheetPose("rest");
      setSheetHinge("left");
      setTurning(null);
      requestAnimationFrame(() => {
        sheet?.classList.remove("tcg-binder__sheet--instant");
      });
    },
    [],
  );

  const finishPrevTurn = useCallback(
    (targetPage: number, data: BinderPageData) => {
      const sheet = sheetRef.current;
      if (sheet) sheet.classList.add("tcg-binder__sheet--instant");
      setPage(targetPage);
      setPageData(data);
      setFlipPageData(null);
      setSheetPose("rest");
      setSheetHinge("left");
      setTurning(null);
      requestAnimationFrame(() => {
        sheet?.classList.remove("tcg-binder__sheet--instant");
      });
    },
    [],
  );

  const turn = useCallback(
    async (dir: "next" | "prev") => {
      if (turning || !opened || loading) return;

      if (dir === "next") {
        const next = page + 1;
        if (next >= pageCount) return;

        clearFlipTimer();
        setSheetHinge("left");
        setTurning("next");
        setSheetPose("flipped");
        flipTimerRef.current = window.setTimeout(() => finishNextTurn(next), PAGE_FLIP_MS);
        return;
      }

      const targetPage = page - 1;
      if (targetPage < 0) return;

      clearFlipTimer();
      setLoading(true);

      try {
        const res = await fetch(
          `/api/binder/${encodeURIComponent(card.username)}?page=${targetPage}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as BinderPageData;

        setFlipPageData(data);
        setSheetHinge("right");
        setTurning("prev");

        const sheet = sheetRef.current;
        sheet?.classList.add("tcg-binder__sheet--instant");
        setSheetPose("flipped");

        requestAnimationFrame(() => {
          sheet?.classList.remove("tcg-binder__sheet--instant");
          setSheetPose("rest");
        });

        flipTimerRef.current = window.setTimeout(
          () => finishPrevTurn(targetPage, data),
          PAGE_FLIP_MS,
        );
      } finally {
        setLoading(false);
      }
    },
    [
      turning,
      opened,
      loading,
      page,
      pageCount,
      card.username,
      clearFlipTimer,
      finishNextTurn,
      finishPrevTurn,
    ],
  );

  const sheetClass = [
    "tcg-binder__sheet",
    "tcg-binder__sheet--active",
    sheetHinge === "right" ? "tcg-binder__sheet--hinge-right" : "tcg-binder__sheet--hinge-left",
    sheetPose === "flipped" ? "tcg-binder__sheet--flipped" : "",
    turning ? "tcg-binder__sheet--turning" : "",
    loading ? "tcg-binder__sheet--loading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const binderClass = [
    "tcg-binder",
    opened ? "tcg-binder--open" : "",
    turning ? "tcg-binder--turning" : "",
    turning === "prev" ? "tcg-binder--turning-prev" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="tcg-binder-wrap">
      <div className="tcg-binder-stage">
        <div className={binderClass}>
          <button
            type="button"
            className="tcg-binder__cover"
            onClick={openBinder}
            aria-label={opened ? "Binder open" : "Open HuggiMon binder"}
            disabled={opened}
          >
            <div className="tcg-binder__cover-face">
              <div className="tcg-binder__cover-frame" aria-hidden />
              <Image
                src="/brand/huggimon-logo.png"
                alt="HuggiMon"
                width={1024}
                height={566}
                className="tcg-binder__cover-logo"
                priority
              />
              <p className="tcg-binder__cover-tagline">Trainer Collection</p>
              <p className="tcg-binder__cover-user">@{card.username}</p>
              {!opened && (
                <span className="tcg-binder__cover-cta">Open binder</span>
              )}
            </div>
            <div className="tcg-binder__cover-inside" aria-hidden />
          </button>

          <div className="tcg-binder__body">
            <div className="tcg-binder__spine" aria-hidden>
              <span className="tcg-binder__spine-text">HuggiMon</span>
            </div>

            <div
              className="tcg-binder__spread"
              style={{ "--tcg-gutter": `${GUTTER_PX}px` } as CSSProperties}
            >
              <div
                className={`tcg-binder__left-pane${page > 0 ? " tcg-binder__left-pane--turned" : ""}`}
                aria-hidden
              >
                <div className="tcg-binder__left-pane-inner">
                  <div className="tcg-page__rear-fill tcg-page__rear-fill--spread" />
                </div>
              </div>

              <div className="tcg-binder__gutter" aria-hidden>
                <div className="tcg-binder__rings">
                  <span className="tcg-binder__ring" />
                  <span className="tcg-binder__ring" />
                  <span className="tcg-binder__ring" />
                </div>
              </div>

              <div className="tcg-binder__right-pane">
                {page < pageCount - 1 && (
                  <div className="tcg-binder__sheet tcg-binder__sheet--under" aria-hidden />
                )}
                {page < pageCount - 2 && (
                  <div
                    className="tcg-binder__sheet tcg-binder__sheet--under-2"
                    aria-hidden
                  />
                )}
              </div>

              <div ref={sheetRef} className={sheetClass}>
                <BinderPageFace
                  data={sheetData}
                  page={turning === "prev" && flipPageData ? flipPageData.pageIndex : page}
                  pageCount={pageCount}
                  binderOpen={opened && !turning}
                />
                <div className="tcg-page tcg-page--rear" aria-hidden>
                  <div className="tcg-page__rear-fill" />
                </div>
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
            onClick={() => void turn("prev")}
            disabled={page === 0 || turning !== null || loading}
            aria-label="Previous page"
          >
            ‹
          </button>

          {pageCount <= 12 ? (
            <div className="tcg-binder__dots" aria-hidden>
              {Array.from({ length: pageCount }, (_, i) => (
                <span
                  key={i}
                  className={`tcg-binder__dot${i === page ? " tcg-binder__dot--on" : ""}`}
                />
              ))}
            </div>
          ) : (
            <span className="tcg-binder__page-indicator" aria-live="polite">
              {page + 1} / {pageCount}
            </span>
          )}

          <button
            type="button"
            className="tcg-binder__nav"
            onClick={() => void turn("next")}
            disabled={page === pageCount - 1 || turning !== null || loading}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
