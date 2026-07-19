"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True after hydration — safe for `createPortal(..., document.body)`. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
