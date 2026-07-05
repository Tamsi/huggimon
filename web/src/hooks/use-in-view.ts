"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Extra margin around the root — prefetch slightly before entering view */
  rootMargin?: string;
  /** Fire only the first time the element becomes visible */
  triggerOnce?: boolean;
  /** Pause observation (e.g. binder cover still closed) */
  enabled?: boolean;
};

export function useInView<T extends Element = Element>({
  rootMargin = "64px",
  triggerOnce = true,
  enabled = true,
}: Options = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { rootMargin, threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin, triggerOnce]);

  return { ref, inView: enabled && inView };
}
