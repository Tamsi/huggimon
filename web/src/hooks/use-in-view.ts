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

    const syncVisible = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      if (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth
      ) {
        setInView(true);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(raf);
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
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    syncVisible();
    const raf = requestAnimationFrame(syncVisible);
    const timer = window.setTimeout(syncVisible, 150);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled, rootMargin, triggerOnce]);

  return { ref, inView: enabled && inView };
}
