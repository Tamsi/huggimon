"use client";

import { animated, to, useSpring } from "@react-spring/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BinderPopoverPortal } from "@/components/BinderPopoverPortal";
import { useBinderActiveCard } from "@/contexts/binder-active-card";
import { useBinderPopover } from "@/hooks/use-binder-popover";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { useDeviceCardTilt } from "@/hooks/use-device-card-tilt";
import { usePopupAnchor } from "@/hooks/use-popup-anchor";
import type { CardVariant } from "@/lib/card-variant";
import { faceLayoutClass, holoRarityForVariant, wireNumber, wireSubtypes } from "@/lib/card-variant";
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
  /** Homepage stack — holo tilt only, no flip / card back */
  preview?: boolean;
  /** On touch devices, tap to zoom like binder pocket cards */
  tapToExpand?: boolean;
  gyroTilt?: boolean;
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
  preview = false,
  tapToExpand = false,
  gyroTilt = !pocket,
}: Props) {
  const faceImage = faceSrc ?? faceUrl;
  const isCoarsePointer = useCoarsePointer();
  const expandOnTap = tapToExpand && isCoarsePointer && !pocket;
  const usesPopover = pocket || expandOnTap;
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

  const onInteractEndRef = useRef<(delay?: number) => void>(() => {});

  const popover = useBinderPopover({
    id: card.username,
    anchorRef: cardRef,
    onInteractEnd: (delay) => onInteractEndRef.current(delay),
    onOpen: () => {
      setInteracting(true);
      api.start({ opacity: 1, config: SPRING_INTERACT });
    },
    sizeMode: expandOnTap ? "hero" : "pocket",
    linkReservePx: expandOnTap ? (pageUrl ? 28 : 0) : undefined,
  });

  const interactEnd = useCallback(
    (delay = 500) => {
      if (usesPopover && popover.active) return;
      setInteracting(false);
      window.setTimeout(() => {
        if (usesPopover && popover.active) return;
        setSprings(
          { x: 55, y: 42 },
          { x: 0, y: 0 },
          { x: 62, y: 38, o: idleOpacity },
        );
      }, delay);
    },
    [setSprings, idleOpacity, usesPopover, popover.active],
  );

  useEffect(() => {
    onInteractEndRef.current = interactEnd;
  }, [interactEnd]);

  const active = usesPopover ? popover.active : flipActive;
  const showInteracting = interacting || (usesPopover && popover.active);

  useEffect(() => {
    if (!usesPopover || !popover.active) return;
    api.start({ opacity: 1, config: SPRING_INTERACT });
  }, [usesPopover, popover.active, api]);

  const toggleFlip = useCallback(() => {
    setFlipActive((wasActive) => {
      const next = !wasActive;
      api.start({ flipY: next ? 180 : 0, config: SPRING_FLIP });
      return next;
    });
  }, [api]);

  const toggleActive = useCallback(() => {
    if (preview && !expandOnTap) return;
    if (usesPopover) popover.toggle();
    else toggleFlip();
  }, [preview, expandOnTap, usesPopover, popover, toggleFlip]);

  const applyInteractFromPercent = useCallback(
    (px: number, py: number) => {
      if (
        pocket &&
        binderActive?.activeKey &&
        binderActive.activeKey !== card.username
      ) {
        return;
      }

      const centerX = px - 50;
      const centerY = py - 50;
      setInteracting(true);
      setSprings(
        { x: adjust(px, 0, 100, 37, 63), y: adjust(py, 0, 100, 33, 67) },
        { x: round(-(centerX / 3.5)), y: round(centerY / 3.5) },
        { x: px, y: py, o: 1 },
      );
    },
    [setSprings, pocket, binderActive, card.username],
  );

  const gyroEligible = gyroTilt || (pocket && isCoarsePointer);
  const gyroActive =
    gyroEligible &&
    !loading &&
    (!isCoarsePointer || !usesPopover || popover.active);

  const deviceTilt = useDeviceCardTilt({
    enabled: gyroActive,
    onInteract: applyInteractFromPercent,
  });

  const preferGyro =
    isCoarsePointer && gyroActive && deviceTilt.permission === "granted";

  const onPointerMoveHandler = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (preferGyro) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = clamp(round((100 / rect.width) * (e.clientX - rect.left)), 0, 100);
      const py = clamp(round((100 / rect.height) * (e.clientY - rect.top)), 0, 100);
      applyInteractFromPercent(px, py);
    },
    [applyInteractFromPercent, preferGyro],
  );

  const onRotatorPointerDown = useCallback(async () => {
    if (!preferGyro) deviceTilt.onPointerDown();
    if (deviceTilt.needsPermissionPrompt) {
      await deviceTilt.prepareOnGesture();
    }
  }, [deviceTilt, preferGyro]);

  const onRotatorPointerUp = useCallback(() => {
    if (!preferGyro) deviceTilt.onPointerUp();
  }, [deviceTilt, preferGyro]);

  useEffect(() => {
    if (!isCoarsePointer || !popover.active) return;
    void deviceTilt.prepareOnGesture();
  }, [isCoarsePointer, popover.active, deviceTilt]);

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

  const portaledStyle = usesPopover
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

  const anchorPlaceholderStyle =
    usesPopover && active
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
    pocket || (expandOnTap && active) ? "hpk-pocket" : "",
    active ? "active" : "",
    showInteracting ? "interacting" : "",
    loading ? "loading" : "",
    variant.masked ? "masked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const layoutAnchor = usePopupAnchor(cardRef, Boolean(usesPopover && popover.active), true);

  const rotatorPointerHandlers = {
    onPointerDown: onRotatorPointerDown,
    onPointerUp: onRotatorPointerUp,
    onPointerCancel: onRotatorPointerUp,
    onPointerMove: onPointerMoveHandler,
    onPointerLeave: () => {
      if (preferGyro && popover.active) return;
      interactEnd();
    },
  };

  const renderCardFace = () => (
    <div className="card__front" style={{ ...staticStyles, ...foilStyles }}>
      {/* Dynamic API / data-URI face — next/image is a poor fit here */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
  );

  const renderCard = (inAnchor: boolean) => (
    <animated.div
      ref={inAnchor ? cardRef : portalCardRef}
      className={`${classNames}${inAnchor && active && usesPopover ? " hpk-pocket--in-pocket" : ""}`}
      data-rarity={holoRarityForVariant(variant)}
      data-supertype={variant.supertype}
      data-subtypes={subtypes}
      data-trainer-gallery={variant.trainerGallery ? "true" : "false"}
      data-set="huggimon"
      data-number={number}
      style={inAnchor ? anchorPlaceholderStyle : portaledStyle}
      aria-hidden={inAnchor && active && usesPopover ? true : undefined}
    >
      <div className="card__translater">
        {preview && !expandOnTap ? (
          <div className="card__rotator" {...rotatorPointerHandlers}>
            {renderCardFace()}
          </div>
        ) : (
          <button
            type="button"
            className="card__rotator"
            aria-label={`Trainer card for ${card.displayName}`}
            aria-pressed={usesPopover || expandOnTap ? active : flipActive}
            onClick={toggleActive}
            {...rotatorPointerHandlers}
            onBlur={preview ? undefined : () => interactEnd(0)}
          >
            {!pocket && !preview && (
              // eslint-disable-next-line @next/next/no-img-element -- static card back asset
              <img
                className="card__back"
                src={CARD_BACK}
                alt=""
                loading="lazy"
                width={660}
                height={921}
              />
            )}
            {renderCardFace()}
          </button>
        )}
      </div>
    </animated.div>
  );

  return (
    <>
      {usesPopover && (
        <BinderPopoverPortal
          open={popover.active}
          anchorRef={portalCardRef}
          pageUrl={pageUrl}
          onClose={popover.close}
        >
          {popover.active && layoutAnchor.width > 4 && (
            <div
              className={`hpk-pocket-portal-slot${expandOnTap ? " hpk-pocket-portal-slot--hero" : ""}`}
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
