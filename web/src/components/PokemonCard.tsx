"use client";

import { animated, useSpring } from "@react-spring/web";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CardVariant } from "@/lib/card-variant";
import { faceLayoutClass, wireNumber, wireSubtypes } from "@/lib/card-variant";
import { energyTypeClass } from "@/lib/energy";
import { clamp, round, adjust } from "@/lib/math";
import type { CardData } from "@/lib/scoring";
import { stageLabel } from "@/lib/scoring";

const CARD_BACK =
  "https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg";

const SPRING_INTERACT = { stiffness: 0.066, damping: 0.25 };

type Props = {
  card: CardData;
  variant: CardVariant;
  faceUrl: string;
  showcase?: boolean;
};

function seedFromUsername(username: string): { x: number; y: number } {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return { x: (h % 1000) / 1000, y: ((h >> 10) % 1000) / 1000 };
}

export function PokemonCard({ card, variant, faceUrl, showcase = false }: Props) {
  const [interacting, setInteracting] = useState(false);
  const [loading, setLoading] = useState(true);

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
        "--card-scale": 1,
        "--translate-x": "0px",
        "--translate-y": "0px",
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
    rotateX: 0,
    rotateY: 0,
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
        rotateX: rot.x,
        rotateY: rot.y,
        opacity: pointer.o,
        config,
      });
    },
    [api],
  );

  const interactEnd = useCallback(
    (delay = 500) => {
      setInteracting(false);
      window.setTimeout(() => {
        setSprings(
          { x: 55, y: 42 },
          { x: 0, y: 0 },
          { x: 62, y: 38, o: idleOpacity },
        );
      }, delay);
    },
    [setSprings, idleOpacity],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
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
    [setSprings],
  );

  useEffect(() => {
    if (!showcase || variant.dataRarity === "common") return;
    // Showcase only when explicitly enabled (e.g. marketing embeds).
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
      return () => window.clearInterval(interval);
    }, 400);
    return () => window.clearTimeout(startTimer);
  }, [showcase, variant.dataRarity, setSprings, interactEnd]);

  const animatedStyle = {
    ...staticStyles,
    "--pointer-x": springs.pointerX.to((v) => `${v}%`),
    "--pointer-y": springs.pointerY.to((v) => `${v}%`),
    "--background-x": springs.bgX.to((v) => `${v}%`),
    "--background-y": springs.bgY.to((v) => `${v}%`),
    "--rotate-x": springs.rotateX.to((v) => `${v}deg`),
    "--rotate-y": springs.rotateY.to((v) => `${v}deg`),
    "--card-opacity": springs.opacity,
    "--pointer-from-top": springs.pointerY.to((v) => v / 100),
    "--pointer-from-left": springs.pointerX.to((v) => v / 100),
    "--pointer-from-center": springs.pointerX.to((px) => {
      const py = springs.pointerY.get();
      return clamp(Math.sqrt((py - 50) ** 2 + (px - 50) ** 2) / 50, 0, 1);
    }),
  };

  const classNames = [
    "card",
    "interactive",
    layoutClass,
    typeClass,
    interacting ? "interacting" : "",
    loading ? "loading" : "",
    variant.masked ? "masked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <animated.div
      className={classNames}
      data-rarity={variant.dataRarity}
      data-supertype={variant.supertype}
      data-subtypes={subtypes}
      data-trainer-gallery={variant.trainerGallery ? "true" : "false"}
      data-set="huggimon"
      data-number={number}
      style={animatedStyle}
    >
      <div className="card__translater">
        <button
          type="button"
          className="card__rotator"
          aria-label={`Trainer card for ${card.displayName}`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => interactEnd()}
          onBlur={() => interactEnd(0)}
        >
          <img
            className="card__back"
            src={CARD_BACK}
            alt=""
            loading="lazy"
            width={660}
            height={921}
          />
          <div className="card__front" style={{ ...staticStyles, ...foilStyles }}>
            <img
              src={faceUrl}
              alt={`Front of ${card.displayName} trainer card`}
              width={660}
              height={921}
              onLoad={() => setLoading(false)}
            />
            <div className="card__shine" />
            <div className="card__glare" />
          </div>
        </button>
      </div>
    </animated.div>
  );
}
