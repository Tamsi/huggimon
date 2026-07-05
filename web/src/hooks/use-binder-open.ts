"use client";

import { useCallback, useEffect, useState } from "react";

const COVER_OPEN_MS = 1080;

export function useBinderOpen() {
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);

  const open = useCallback(() => {
    if (opened || opening) return;
    setOpening(true);
  }, [opened, opening]);

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => {
      setOpened(true);
      setOpening(false);
    }, COVER_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [opening]);

  const isVisible = opened || opening;

  return {
    opened,
    opening,
    isVisible,
    open,
  };
}
