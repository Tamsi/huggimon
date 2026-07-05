"use client";

import { easings, useSpring } from "@react-spring/web";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BinderPageData } from "@/lib/binder-fetcher";

const FLIP_CONFIG = { duration: 880, easing: easings.easeInOutCubic };

type TurnDir = "next" | "prev";

type Options = {
  username: string;
  initialPage: BinderPageData;
  opened: boolean;
};

/**
 * Real-binder spread model: each physical sheet holds a page on both sides.
 * Spread `s` shows page `2s-1` on the left and page `2s` on the right
 * (spread 0 = inside cover + first page). Turning rotates one sheet
 * around the central spine, revealing its back side.
 */
export function useBinderSpread({ username, initialPage, opened }: Options) {
  const cacheRef = useRef(new Map<number, BinderPageData>());
  cacheRef.current.set(initialPage.pageIndex, initialPage);

  const [spread, setSpread] = useState(0);
  const [turning, setTurning] = useState<TurnDir | null>(null);
  const [frozenSpread, setFrozenSpread] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const lockRef = useRef(false);
  const pendingAnimRef = useRef<TurnDir | null>(null);
  const frozenSpreadRef = useRef<number | null>(null);

  const totalPages = initialPage.totalPages;
  const maxSpread = Math.floor(totalPages / 2);

  const [{ rotateY }, flipApi] = useSpring(() => ({ rotateY: 0 }));

  const getPage = useCallback(
    (index: number): BinderPageData | null => {
      if (index < 0 || index >= totalPages) return null;
      return cacheRef.current.get(index) ?? null;
    },
    [totalPages],
  );

  const fetchPage = useCallback(
    async (index: number): Promise<BinderPageData | null> => {
      if (index < 0 || index >= totalPages) return null;
      const cached = cacheRef.current.get(index);
      if (cached) return cached;

      const res = await fetch(
        `/api/binder/${encodeURIComponent(username)}?page=${index}`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as BinderPageData;
      cacheRef.current.set(index, data);
      return data;
    },
    [username, totalPages],
  );

  useEffect(() => {
    if (!opened) return;
    const neighbors = [
      2 * spread + 1,
      2 * spread + 2,
      2 * spread - 2,
      2 * spread - 3,
    ];
    let cancelled = false;
    void Promise.all(neighbors.map(fetchPage));
    return () => {
      cancelled = true;
    };
  }, [opened, spread, fetchPage]);

  const settle = useCallback(
    (target: number) => {
      setSpread(target);
      flipApi.start({ rotateY: 0, immediate: true });
      setTurning(null);
      setFrozenSpread(null);
      frozenSpreadRef.current = null;
      lockRef.current = false;
      pendingAnimRef.current = null;
    },
    [flipApi],
  );

  // Start the spring only after the turning sheet is in the DOM (avoids mount jumps).
  useEffect(() => {
    const dir = pendingAnimRef.current;
    if (!dir || turning !== dir) return;

    if (dir === "next") {
      flipApi.start({ rotateY: 0, immediate: true });
      flipApi.start({
        rotateY: -180,
        config: FLIP_CONFIG,
        onRest: ({ finished }) => {
          if (!finished || pendingAnimRef.current !== "next") return;
          const base = frozenSpreadRef.current;
          if (base === null) return;
          settle(base + 1);
        },
      });
      return;
    }

    flipApi.start({ rotateY: -180, immediate: true });
    flipApi.start({
      rotateY: 0,
      config: FLIP_CONFIG,
      onRest: ({ finished }) => {
        if (!finished || pendingAnimRef.current !== "prev") return;
        const base = frozenSpreadRef.current;
        if (base === null) return;
        settle(base - 1);
      },
    });
  }, [turning, flipApi, settle]);

  const turn = useCallback(
    async (dir: TurnDir) => {
      if (!opened || lockRef.current) return;
      const target = dir === "next" ? spread + 1 : spread - 1;
      if (target < 0 || target > maxSpread) return;

      lockRef.current = true;
      setLoading(true);

      const needed =
        dir === "next"
          ? [2 * spread + 1, 2 * spread + 2]
          : [2 * spread - 2, 2 * spread - 3];
      await Promise.all(needed.map(fetchPage));

      setLoading(false);
      frozenSpreadRef.current = spread;
      setFrozenSpread(spread);
      pendingAnimRef.current = dir;
      setTurning(dir);
    },
    [opened, spread, maxSpread, fetchPage],
  );

  useEffect(() => {
    if (opened) return;
    flipApi.start({ rotateY: 0, immediate: true });
    setTurning(null);
    setFrozenSpread(null);
    frozenSpreadRef.current = null;
    setSpread(0);
    lockRef.current = false;
    pendingAnimRef.current = null;
  }, [opened, flipApi]);

  const viewSpread = frozenSpread ?? spread;

  const leftIndex = 2 * viewSpread - 1;
  const rightIndex =
    turning === "next" ? 2 * viewSpread + 2 : 2 * viewSpread;

  const sheetFrontIndex =
    turning === "prev" ? 2 * viewSpread - 2 : 2 * viewSpread;
  const sheetBackIndex =
    turning === "prev" ? 2 * viewSpread - 1 : 2 * viewSpread + 1;

  return {
    spread,
    maxSpread,
    totalPages,
    turning,
    loading,
    rotateY,
    turn,
    leftPage: getPage(leftIndex),
    rightPage: getPage(rightIndex),
    sheetFront: turning ? getPage(sheetFrontIndex) : null,
    sheetBack: turning ? getPage(sheetBackIndex) : null,
  };
}
