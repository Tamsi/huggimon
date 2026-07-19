"use client";

import { useEffect, useState, type RefObject } from "react";
import { measurePopoverAnchor, type PopupAnchor } from "@/lib/popover-anchor";

export type { PopupAnchor };

const EMPTY: PopupAnchor = {
  top: 0,
  left: 0,
  rectTop: 0,
  rectLeft: 0,
  width: 0,
  height: 0,
};

export function usePopupAnchor(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  layout = false,
): PopupAnchor {
  const [liveAnchor, setLiveAnchor] = useState<PopupAnchor>(EMPTY);

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    const tick = () => {
      const next = measurePopoverAnchor(ref, layout);
      if (next) setLiveAnchor(next);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, ref, layout]);

  return active ? liveAnchor : EMPTY;
}
