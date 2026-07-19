"use client";

import { useSpring } from "@react-spring/web";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useBinderActiveCard } from "@/contexts/binder-active-card";
import { measurePopoverAnchor } from "@/lib/popover-anchor";
import { round } from "@/lib/math";

const SPRING_POPOVER = { stiffness: 0.033, damping: 0.45 };
const LINK_RESERVE_PX = 56;
const POPOVER_MAX_SCALE = 1.85;
const HERO_POPOVER_MAX_SCALE = 2.8;

export type PopoverSizeMode = "pocket" | "hero";

function popoverScale(
  size: { width: number; height: number },
  mode: PopoverSizeMode,
): number {
  if (mode === "hero") {
    const maxW = Math.min(440, window.innerWidth * 0.94);
    const maxH = Math.min(640, (window.innerHeight - LINK_RESERVE_PX) * 0.8);
    const scaleW = maxW / size.width;
    const scaleH = maxH / size.height;
    return Math.min(scaleW, scaleH, HERO_POPOVER_MAX_SCALE);
  }

  const maxW = Math.min(300, window.innerWidth * 0.42);
  const maxH = Math.min(420, (window.innerHeight - LINK_RESERVE_PX) * 0.48);
  const scaleW = maxW / size.width;
  const scaleH = maxH / size.height;
  return Math.min(scaleW, scaleH, POPOVER_MAX_SCALE);
}

type Options = {
  id: string;
  anchorRef: RefObject<HTMLElement | null>;
  onInteractEnd?: (delay?: number) => void;
  onOpen?: () => void;
  sizeMode?: PopoverSizeMode;
  /** Extra upward shift to leave room for the popover link (px) */
  linkReservePx?: number;
};

export function useBinderPopover({
  id,
  anchorRef,
  onInteractEnd,
  onOpen,
  sizeMode = "pocket",
  linkReservePx,
}: Options) {
  const binderActive = useBinderActiveCard();
  const [localActiveKey, setLocalActiveKey] = useState<string | null>(null);
  const firstPopRef = useRef(true);
  const active = binderActive
    ? binderActive.activeKey === id
    : localActiveKey === id;

  const [popSprings, popApi] = useSpring(() => ({
    scale: 1,
    tx: 0,
    ty: 0,
    rotateDelta: 0,
    config: SPRING_POPOVER,
  }));

  const setCenter = useCallback(() => {
    const anchor = measurePopoverAnchor(anchorRef, true);
    if (!anchor) return;

    const reserve =
      linkReservePx ??
      (sizeMode === "hero" ? 0 : LINK_RESERVE_PX / 2);
    const centerX = anchor.rectLeft + anchor.width / 2;
    const centerY = anchor.rectTop + anchor.height / 2;

    popApi.start({
      tx: round(window.innerWidth / 2 - centerX),
      ty: round(window.innerHeight / 2 - centerY - reserve),
      config: SPRING_POPOVER,
    });
  }, [anchorRef, popApi, linkReservePx, sizeMode]);

  const retreat = useCallback(() => {
    popApi.start({
      scale: 1,
      tx: 0,
      ty: 0,
      rotateDelta: 0,
      config: SPRING_POPOVER,
    });
    onInteractEnd?.(100);
  }, [popApi, onInteractEnd]);

  const popover = useCallback(() => {
    const anchor = measurePopoverAnchor(anchorRef, true);
    if (!anchor) return;

    const target =
      anchorRef.current?.querySelector<HTMLElement>(".card__translater") ??
      anchorRef.current?.querySelector<HTMLElement>(".tcg-pocket__trainer-hit") ??
      anchorRef.current;

    if (!target) return;

    const scale = popoverScale(
      {
        width: target.offsetWidth,
        height: target.offsetHeight,
      },
      sizeMode,
    );
    setCenter();
    onOpen?.();

    if (firstPopRef.current) {
      popApi.start({ rotateDelta: 360, config: SPRING_POPOVER });
      firstPopRef.current = false;
    }
    popApi.start({ scale, config: SPRING_POPOVER });
  }, [anchorRef, popApi, setCenter, onOpen, sizeMode]);

  const close = useCallback(() => {
    if (binderActive) binderActive.close();
    else setLocalActiveKey(null);
    retreat();
  }, [binderActive, retreat]);

  const open = useCallback(() => {
    if (binderActive) binderActive.open(id);
    else setLocalActiveKey(id);
    popover();
  }, [binderActive, id, popover]);

  const toggle = useCallback(() => {
    if (active) close();
    else open();
  }, [active, close, open]);

  useEffect(() => {
    const isActive = binderActive
      ? binderActive.activeKey === id
      : localActiveKey === id;
    if (!isActive) {
      popApi.start({
        scale: 1,
        tx: 0,
        ty: 0,
        rotateDelta: 0,
        config: SPRING_POPOVER,
      });
    }
  }, [binderActive, binderActive?.activeKey, localActiveKey, id, popApi]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => {
      const s = popSprings.scale.get();
      if (s > 1) {
        setCenter();
        if (sizeMode === "hero") popover();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, setCenter, popSprings.scale, sizeMode, popover]);

  return {
    active,
    toggle,
    close,
    popSprings,
  };
}
