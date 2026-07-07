"use client";

import { useEffect, useState } from "react";

const COARSE_QUERY = "(pointer: coarse), (hover: none)";

export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(COARSE_QUERY);
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return coarse;
}
