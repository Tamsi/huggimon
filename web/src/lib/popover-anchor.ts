import type { RefObject } from "react";

export type PopupAnchor = {
  top: number;
  /** Center X for link positioning */
  left: number;
  rectTop: number;
  rectLeft: number;
  width: number;
  height: number;
};

/** Bounding box used for popup layout (layout) or link placement (visual). */
export function measurePopoverAnchor(
  ref: RefObject<HTMLElement | null>,
  layout = false,
): PopupAnchor | null {
  const root = ref.current;
  if (!root) return null;

  const target =
    root.querySelector<HTMLElement>(".card__translater") ??
    root.querySelector<HTMLElement>(".tcg-pocket__trainer-hit") ??
    root;

  const rect = target.getBoundingClientRect();
  const width = layout ? target.offsetWidth : rect.width;
  const height = layout ? target.offsetHeight : rect.height;

  return {
    top: rect.top,
    left: rect.left + width / 2,
    rectTop: rect.top,
    rectLeft: rect.left,
    width,
    height,
  };
}
