"use client";

import { animated, to } from "@react-spring/web";
import Image from "next/image";
import type { CSSProperties } from "react";
import { BinderPocketCard } from "@/components/BinderPocketCard";
import { TrainerPocketCard } from "@/components/TrainerPocketCard";
import { BinderActiveCardProvider } from "@/contexts/binder-active-card";
import { useBinderOpen } from "@/hooks/use-binder-open";
import { useBinderSpread } from "@/hooks/use-binder-spread";
import { useMobileBinderView } from "@/hooks/use-mobile-binder-view";
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
  );
}

function BinderPage({
  data,
  side,
  totalPages,
  binderOpen,
  single = false,
}: {
  data: BinderPageData;
  side: "left" | "right";
  totalPages: number;
  binderOpen: boolean;
  single?: boolean;
}) {
  const statsLine =
    data.totalFollowers > 0 || data.totalLikes > 0
      ? `${data.totalFollowers} followers · ${data.totalLikes} likes`
      : "Empty collection";

  return (
    <div
      className={`tcg-page tcg-page--${side}${single ? " tcg-page--single" : ""}`}
    >
      <header className="tcg-page__head">
        <span className="tcg-page__num">
          Page {data.pageIndex + 1}/{totalPages}
        </span>
        <span className="tcg-page__label">{data.label}</span>
        <span className="tcg-page__stats">{statsLine}</span>
      </header>
      <PocketGrid slots={data.slots} binderOpen={binderOpen} />
    </div>
  );
}

function InsideCover({ side }: { side: "left" | "right" }) {
  return (
    <div className={`tcg-page tcg-binder__inside-cover tcg-page--${side}`} aria-hidden>
      <span className="tcg-binder__inside-cover-mark">HuggiMon</span>
    </div>
  );
}

function PaneContent({
  data,
  side,
  totalPages,
  binderOpen,
}: {
  data: BinderPageData | null;
  side: "left" | "right";
  totalPages: number;
  binderOpen: boolean;
}) {
  if (!data) return <InsideCover side={side} />;
  return (
    <BinderPage
      data={data}
      side={side}
      totalPages={totalPages}
      binderOpen={binderOpen}
    />
  );
}

const GUTTER_PX = 0;

export function HuggimonBinder({ card, initialPage }: Props) {
  const mobileView = useMobileBinderView();
  const { opened, opening, isVisible, open } = useBinderOpen();
  const spreadState = useBinderSpread({
    username: card.username,
    initialPage,
    opened,
    singlePage: mobileView,
  });

  const {
    spread,
    maxSpread,
    totalPages,
    pageIndex,
    maxPageIndex,
    currentPage,
    turning,
    loading,
    rotateY,
    turn,
    leftPage,
    rightPage,
    sheetFront,
    sheetBack,
  } = spreadState;

  const interactive = opened && turning === null && !loading;
  const activePage = currentPage ?? initialPage;

  const sheetStyle = {
    transform: to(rotateY, (ry) => {
      const abs = Math.abs(ry);
      const lift = Math.sin((abs * Math.PI) / 180) * 16 + 0.5;
      return `translateZ(${lift}px) rotateY(${ry}deg)`;
    }),
  };

  const binderClass = [
    "tcg-binder",
    isVisible ? "tcg-binder--visible" : "",
    opening ? "tcg-binder--opening" : "",
    opened ? "tcg-binder--open" : "",
    turning ? "tcg-binder--turning" : "",
    mobileView ? "tcg-binder--mobile" : "",
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
            onClick={open}
            aria-label={opened ? "Binder open" : "Open HuggiMon binder"}
            disabled={isVisible}
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
              {!isVisible && (
                <span className="tcg-binder__cover-cta">Open binder</span>
              )}
            </div>
            <div className="tcg-binder__cover-inside" aria-hidden />
          </button>

          <div className="tcg-binder__body">
            <BinderActiveCardProvider>
              {mobileView ? (
                <div
                  key={pageIndex}
                  className={`tcg-binder__mobile-view${loading ? " tcg-binder__mobile-view--loading" : ""}`}
                >
                  <BinderPage
                    data={activePage}
                    side="right"
                    totalPages={totalPages}
                    binderOpen={interactive}
                    single
                  />
                </div>
              ) : (
                <div
                  className="tcg-binder__spread"
                  style={{ "--tcg-gutter": `${GUTTER_PX}px` } as CSSProperties}
                >
                  <div className="tcg-binder__pane tcg-binder__pane--left">
                    {spread > 0 && (
                      <div
                        className="tcg-binder__stack-edge tcg-binder__stack-edge--left"
                        aria-hidden
                      />
                    )}
                    <PaneContent
                      data={leftPage}
                      side="left"
                      totalPages={totalPages}
                      binderOpen={interactive}
                    />
                  </div>

                  <div className="tcg-binder__gutter" aria-hidden />

                  <div
                    className={`tcg-binder__pane tcg-binder__pane--right${turning === "next" ? " tcg-binder__pane--under-turn" : ""}`}
                  >
                    {spread < maxSpread && (
                      <div
                        className="tcg-binder__stack-edge tcg-binder__stack-edge--right"
                        aria-hidden
                      />
                    )}
                    <PaneContent
                      data={rightPage}
                      side="right"
                      totalPages={totalPages}
                      binderOpen={interactive}
                    />
                  </div>

                  <animated.div
                    className={`tcg-binder__sheet${turning ? " tcg-binder__sheet--live" : ""}`}
                    style={sheetStyle}
                    aria-hidden={!turning}
                  >
                    <div className="tcg-binder__sheet-face tcg-binder__sheet-face--front">
                      <PaneContent
                        data={sheetFront}
                        side="right"
                        totalPages={totalPages}
                        binderOpen={false}
                      />
                    </div>
                    <div className="tcg-binder__sheet-face tcg-binder__sheet-face--back">
                      <PaneContent
                        data={sheetBack}
                        side="left"
                        totalPages={totalPages}
                        binderOpen={false}
                      />
                    </div>
                  </animated.div>
                </div>
              )}
            </BinderActiveCardProvider>
          </div>
        </div>
      </div>

      {opened && (
        <div className="tcg-binder__controls">
          <button
            type="button"
            className="tcg-binder__nav"
            onClick={() => void turn("prev")}
            disabled={
              mobileView
                ? pageIndex === 0 || loading
                : spread === 0 || turning !== null || loading
            }
            aria-label={mobileView ? "Previous page" : "Previous pages"}
          >
            ‹
          </button>

          {mobileView ? (
            <span className="tcg-binder__page-indicator" aria-live="polite">
              {pageIndex + 1} / {totalPages}
            </span>
          ) : maxSpread + 1 <= 12 ? (
            <div className="tcg-binder__dots" aria-hidden>
              {Array.from({ length: maxSpread + 1 }, (_, i) => (
                <span
                  key={i}
                  className={`tcg-binder__dot${i === spread ? " tcg-binder__dot--on" : ""}`}
                />
              ))}
            </div>
          ) : (
            <span className="tcg-binder__page-indicator" aria-live="polite">
              {spread + 1} / {maxSpread + 1}
            </span>
          )}

          <button
            type="button"
            className="tcg-binder__nav"
            onClick={() => void turn("next")}
            disabled={
              mobileView
                ? pageIndex >= maxPageIndex || loading
                : spread === maxSpread || turning !== null || loading
            }
            aria-label={mobileView ? "Next page" : "Next pages"}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
