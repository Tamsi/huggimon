"use client";

import { animated, to } from "@react-spring/web";
import { useEffect, useRef } from "react";
import { BinderPopoverPortal } from "@/components/BinderPopoverPortal";
import { TrainerMiniCard } from "@/components/TrainerMiniCard";
import { useBinderPopover } from "@/hooks/use-binder-popover";
import { usePopupAnchor } from "@/hooks/use-popup-anchor";
import { useTrainerCardTilt } from "@/hooks/use-trainer-card-tilt";
import type { LikeTrainerCard } from "@/lib/binder-fetcher";

const SPRING_INTERACT = { stiffness: 0.066, damping: 0.25 };

type Props = {
  card: LikeTrainerCard;
  binderOpen: boolean;
};

export function TrainerPocketCard({ card, binderOpen }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalAnchorRef = useRef<HTMLDivElement>(null);
  const tilt = useTrainerCardTilt(binderOpen);
  const popover = useBinderPopover({
    id: card.repoName,
    anchorRef,
    onOpen: () => {
      tilt.setInteracting(true);
      tilt.api.start({ px: 62, py: 38, rx: 0, ry: 0, config: SPRING_INTERACT });
    },
    onInteractEnd: () => {
      tilt.onPointerLeave();
    },
  });

  const layoutAnchor = usePopupAnchor(anchorRef, Boolean(popover.active && binderOpen), true);

  useEffect(() => {
    if (!popover.active) return;
    tilt.setInteracting(true);
  }, [popover.active, tilt.setInteracting]);

  const popStyle = {
    transform: to(
      [
        popover.popSprings.tx,
        popover.popSprings.ty,
        popover.popSprings.scale,
        popover.popSprings.rotateDelta,
      ],
      (x, y, s, rd) =>
        `translate3d(${x}px, ${y}px, 0) scale(${s}) rotateZ(${rd}deg)`,
    ),
  };

  const anchorClass = `tcg-pocket__trainer-anchor${popover.active ? " tcg-pocket__trainer-anchor--active" : ""}`;
  const inPocketClass = `${anchorClass}${popover.active ? " tcg-pocket__trainer-anchor--in-pocket" : ""}`;

  const renderAnchor = (inPocket: boolean) => (
    <animated.div
      ref={inPocket ? anchorRef : portalAnchorRef}
      className={inPocket ? inPocketClass : anchorClass}
      style={binderOpen && !inPocket ? popStyle : undefined}
      aria-hidden={inPocket && popover.active ? true : undefined}
    >
      <button
        type="button"
        className="tcg-pocket__trainer-hit"
        aria-label={`Open ${card.displayName}`}
        aria-pressed={popover.active}
        disabled={!binderOpen}
        onClick={popover.toggle}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={() => {
          if (popover.active) return;
          tilt.onPointerLeave();
        }}
        onBlur={() => {
          if (popover.active) return;
          tilt.onPointerLeave();
        }}
      >
        <animated.div className="hpkt-tilt" style={tilt.tiltStyle}>
          <TrainerMiniCard card={card} interacting={tilt.interacting || popover.active} />
        </animated.div>
      </button>
    </animated.div>
  );

  return (
    <>
      <BinderPopoverPortal
        open={popover.active && binderOpen}
        anchorRef={portalAnchorRef}
        pageUrl={card.hfUrl}
        onClose={popover.close}
      >
        {popover.active && binderOpen && layoutAnchor.width > 4 && (
          <div
            className="hpk-pocket-portal-slot"
            style={{
              top: layoutAnchor.rectTop,
              left: layoutAnchor.rectLeft,
              width: layoutAnchor.width,
              height: layoutAnchor.height,
            }}
          >
            {renderAnchor(false)}
          </div>
        )}
      </BinderPopoverPortal>

      {renderAnchor(true)}
    </>
  );
}
