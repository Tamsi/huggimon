"use client";

import { animated, to, useSpring } from "@react-spring/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BinderPopoverPortal } from "@/components/BinderPopoverPortal";
import { useBinderActiveCard } from "@/contexts/binder-active-card";
import { useBinderPopover } from "@/hooks/use-binder-popover";
import { usePopupAnchor } from "@/hooks/use-popup-anchor";
import type { CardVariant } from "@/lib/card-variant";
import { faceLayoutClass, wireNumber, wireSubtypes } from "@/lib/card-variant";
import { energyTypeClass } from "@/lib/energy";
import { clamp, round, adjust } from "@/lib/math";
import type { CardData } from "@/lib/scoring";
import { stageLabel } from "@/lib/scoring";

const CARD_BACK = "/brand/card-back.png";

const SPRING_INTERACT = { stiffness: 0.066, damping: 0.25 };
const SPRING_FLIP = { tension: 220, friction: 24 };

type Props = {
  card: CardData;
  variant: CardVariant;
  faceUrl: string;
  faceSrc?: string;
  showcase?: boolean;
  introHolo?: boolean;
  pocket?: boolean;
  pageUrl?: string;
  imagePriority?: "high" | "low" | "auto";
  imageLoading?: "eager" | "lazy";
};

function seedFromUsername(username: string): { x: number; y: number } {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return { x: (h % 1000) / 1000, y: ((h >> 10) % 1000) / 1000 };
}

export function PokemonCard({
  card,
  variant,
  faceUrl,
  faceSrc,
  showcase = false,
  introHolo = false,
  pocket = false,
  pageUrl,
  imagePriority = pocket ? "low" : "high",
  imageLoading = pocket ? "lazy" : "eager",
}: Props) {
  const faceImage = faceSrc ?? faceUrl;
  const binderActive = useBinderActiveCard();
  const cardRef = useRef<HTMLDivElement>(null);
  const portalCardRef = useRef<HTMLDivElement>(null);
  const [interacting, setInteracting] = useState(false);
  const [loading, setLoading] = useState(!faceSrc);
  const [flipActive, setFlipActive] = useState(false);

  const randomSeed = useMemo(() => seedFromUsername(card.username), [card.username]);
  const cosmosPosition = useMemo(
    () => ({
      x: Math.floor(randomSeed.x * 734),
      y: Math.floor(randomSeed.y * 1280),
    }),
    [randomSeed],
  );

  const stage = stageLabel(card);
  const subtypes = wireSubtypes(variant, stage);
  const number = wireNumber(variant, card.level);
  const typeClass = energyTypeClass(card.energyName);
  const idleOpacity = variant.dataRarity === "common" ? 0 : 0.72;
  const layoutClass = faceLayoutClass(variant);

  const staticStyles = useMemo(
    () =>
      ({
        "--seedx": randomSeed.x,
        "--seedy": randomSeed.y,
        "--cosmosbg": `${cosmosPosition.x}px ${cosmosPosition.y}px`,
      }) as React.CSSProperties,
    [randomSeed, cosmosPosition],
  );

  const foilStyles = useMemo(() => {
    const s: Record<string, string> = {};
    if (variant.foil) s["--foil"] = `url(${variant.foil})`;
    if (variant.mask) s["--mask"] = `url(${variant.mask})`;
    return s as React.CSSProperties;
  }, [variant]);

  const [springs, api] = useSpring(() => ({
    pointerX: 62,
    pointerY: 38,
    bgX: 55,
    bgY: 42,
    tiltX: 0,
    tiltY: 0,
    flipY: 0,
    opacity: idleOpacity,
    config: SPRING_INTERACT,
  }));

  const setSprings = useCallback(
    (
      bg: { x: number; y: number },
      rot: { x: number; y: number },
      pointer: { x: number; y: number; o: number },
      config = SPRING_INTERACT,
    ) => {
      api.start({
        pointerX: pointer.x,
        pointerY: pointer.y,
        bgX: bg.x,
        bgY: bg.y,
        tiltX: rot.x,
        tiltY: rot.y,
        opacity: pointer.o,
        config,
      });
    },
    [api],
  );

  const interactEnd = useCallback(
    (delay = 500) => {
      if (pocket && binderActive?.activeKey === card.username) return;
      setInteracting(false);
      window.setTimeout(() => {
        if (pocket && binderActive?.activeKey === card.username) return;
        setSprings(
          { x: 55, y: 42 },
          { x: 0, y: 0 },
          { x: 62, y: 38, o: idleOpacity },
        );
      }, delay);
    },
    [setSprings, idleOpacity, pocket, binderActive?.activeKey, card.username],
  );

  const popover = useBinderPopover({
    id: card.username,
    anchorRef: cardRef,
    onInteractEnd: interactEnd,
    onOpen: () => {
      setInteracting(true);
      api.start({ opacity: 1, config: SPRING_INTERACT });
    },
  });

  const active = pocket ? popover.active : flipActive;

  useEffect(() => {
    if (!pocket || !popover.active) return;
    setInteracting(true);
    api.start({ opacity: 1, config: SPRING_INTERACT });
  }, [pocket, popover.active, api]);

  const toggleFlip = useCallback(() => {
    setFlipActive((wasActive) => {
      const next = !wasActive;
      api.start({ flipY: next ? 180 : 0, config: SPRING_FLIP });
      return next;
    });
  }, [api]);

  const toggleActive = useCallback(() => {
    if (pocket) popover.toggle();
    else toggleFlip();
  }, [pocket, popover, toggleFlip]);

  const onPointerMoveHandler = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (
        pocket &&
        binderActive?.activeKey &&
        binderActive.activeKey !== card.username
      ) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const px = clamp(round((100 / rect.width) * (e.clientX - rect.left)), 0, 100);
      const py = clamp(round((100 / rect.height) * (e.clientY - rect.top)), 0, 100);
      const centerX = px - 50;
      const centerY = py - 50;
      setInteracting(true);
      setSprings(
        { x: adjust(px, 0, 100, 37, 63), y: adjust(py, 0, 100, 33, 67) },
        { x: round(-(centerX / 3.5)), y: round(centerY / 3.5) },
        { x: px, y: py, o: 1 },
      );
    },
    [setSprings, pocket, binderActive?.activeKey, card.username],
  );

  useEffect(() => {
    if (!showcase || variant.dataRarity === "common") return;
    const startTimer = window.setTimeout(() => {
      setInteracting(true);
      let r = 0;
      const interval = window.setInterval(() => {
        r += 0.05;
        setSprings(
          { x: 20 + Math.cos(r) * 20, y: 20 + Math.sin(r) * 20 },
          { x: Math.sin(r) * 25, y: Math.cos(r) * 25 },
          { x: 55 + Math.sin(r) * 55, y: 55 + Math.cos(r) * 55, o: 0.85 },
          { stiffness: 0.02, damping: 0.5 },
        );
      }, 20);
      window.setTimeout(() => {
        window.clearInterval(interval);
        interactEnd(0);
      }, 4000);
    }, 400);
    return () => window.clearTimeout(startTimer);
  }, [showcase, variant.dataRarity, setSprings, interactEnd]);

  useEffect(() => {
    if (!introHolo || pocket || variant.dataRarity === "common") return;
    const startTimer = window.setTimeout(() => {
      setInteracting(true);
      let r = 0;
      const interval = window.setInterval(() => {
        r += 0.07;
        setSprings(
          { x: 28 + Math.cos(r) * 14, y: 28 + Math.sin(r) * 14 },
          { x: Math.sin(r) * 18, y: Math.cos(r) * 18 },
          { x: 48 + Math.sin(r) * 48, y: 48 + Math.cos(r) * 48, o: 1 },
          { stiffness: 0.03, damping: 0.45 },
        );
      }, 20);
      window.setTimeout(() => {
        window.clearInterval(interval);
        interactEnd(0);
      }, 2200);
    }, 550);
    return () => window.clearTimeout(startTimer);
  }, [introHolo, pocket, variant.dataRarity, setSprings, interactEnd]);

  const holoStyle = {
    "--pointer-x": springs.pointerX.to((v) => `${v}%`),
    "--pointer-y": springs.pointerY.to((v) => `${v}%`),
    "--background-x": springs.bgX.to((v) => `${v}%`),
    "--background-y": springs.bgY.to((v) => `${v}%`),
    "--rotate-y": springs.tiltY.to((v) => `${v}deg`),
    "--card-opacity": springs.opacity,
    "--pointer-from-top": springs.pointerY.to((v) => v / 100),
    "--pointer-from-left": springs.pointerX.to((v) => v / 100),
    "--pointer-from-center": springs.pointerX.to((px) => {
      const py = springs.pointerY.get();
      return clamp(Math.sqrt((py - 50) ** 2 + (px - 50) ** 2) / 50, 0, 1);
    }),
  };

  const { popSprings } = popover;

  const portaledStyle = pocket
    ? {
        ...staticStyles,
        ...holoStyle,
        "--card-scale": popSprings.scale,
        "--translate-x": popSprings.tx.to((v) => `${v}px`),
        "--translate-y": popSprings.ty.to((v) => `${v}px`),
        "--rotate-x": to(
          [springs.tiltX, popSprings.rotateDelta],
          (tx, rd) => `${tx + rd}deg`,
        ),
      }
    : {
        ...staticStyles,
        ...holoStyle,
        "--card-scale": 1,
        "--translate-x": "0px",
        "--translate-y": "0px",
        "--rotate-x": to([springs.tiltX, springs.flipY], (tx, fy) => `${tx + fy}deg`),
      };

  const pocketPlaceholderStyle =
    pocket && active
      ? {
          ...staticStyles,
          ...holoStyle,
          "--card-scale": 1,
          "--translate-x": "0px",
          "--translate-y": "0px",
          "--rotate-x": springs.tiltX.to((tx) => `${tx}deg`),
        }
      : portaledStyle;

  const classNames = [
    "card",
    "interactive",
    layoutClass,
    typeClass,
    pocket ? "hpk-pocket" : "",
    active ? "active" : "",
    interacting ? "interacting" : "",
    loading ? "loading" : "",
    variant.masked ? "masked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const layoutAnchor = usePopupAnchor(cardRef, Boolean(pocket && popover.active), true);

  const renderCard = (inPocket: boolean) => (
    <animated.div
      ref={inPocket ? cardRef : portalCardRef}
      className={`${classNames}${inPocket && active ? " hpk-pocket--in-pocket" : ""}`}
      data-rarity={variant.dataRarity}
      data-supertype={variant.supertype}
      data-subtypes={subtypes}
      data-trainer-gallery={variant.trainerGallery ? "true" : "false"}
      data-set="huggimon"
      data-number={number}
      style={inPocket ? pocketPlaceholderStyle : portaledStyle}
      aria-hidden={inPocket && active ? true : undefined}
    >
      <div className="card__translater">
        <button
          type="button"
          className="card__rotator"
          aria-label={`Trainer card for ${card.displayName}`}
          aria-pressed={active}
          onClick={toggleActive}
          onPointerMove={onPointerMoveHandler}
          onPointerLeave={() => interactEnd()}
          onBlur={() => interactEnd(0)}
        >
          {!pocket && (
            <img
              className="card__back"
              src={CARD_BACK}
              alt=""
              loading="lazy"
              width={660}
              height={921}
            />
          )}
          <div className="card__front" style={{ ...staticStyles, ...foilStyles }}>
            <img
              src={faceImage}
              alt={`Front of ${card.displayName} trainer card`}
              width={660}
              height={921}
              loading={imageLoading}
              decoding={faceSrc ? "sync" : "async"}
              fetchPriority={imagePriority}
              onLoad={() => setLoading(false)}
            />
            <div className="card__shine" />
            <div className="card__glare" />
          </div>
        </button>
      </div>
    </animated.div>
  );

  return (
    <>
      {pocket && (
        <BinderPopoverPortal
          open={popover.active}
          anchorRef={portalCardRef}
          pageUrl={pageUrl}
          onClose={popover.close}
        >
          {popover.active && layoutAnchor.width > 4 && (
            <div
              className="hpk-pocket-portal-slot"
              style={{
                top: layoutAnchor.rectTop,
                left: layoutAnchor.rectLeft,
                width: layoutAnchor.width,
                height: layoutAnchor.height,
              }}
            >
              {renderCard(false)}
            </div>
          )}
        </BinderPopoverPortal>
      )}

      {renderCard(true)}
    </>
  );
}
