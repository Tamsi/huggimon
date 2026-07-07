"use client";

import { useEffect, useState } from "react";
import { PokemonCard } from "@/components/PokemonCard";
import { useInView } from "@/hooks/use-in-view";
import type { FollowerRef } from "@/lib/binder-fetcher";
import { fetchCardPayload, type CardApiPayload } from "@/lib/card-api";

type Props = {
  follower: FollowerRef;
  /** Binder must be open before cards start loading */
  active: boolean;
  /** Skip viewport lazy-load (mobile single-page binder) */
  eager?: boolean;
};

export function BinderPocketCard({ follower, active, eager = false }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: "48px",
    triggerOnce: true,
    enabled: active,
  });
  const [payload, setPayload] = useState<CardApiPayload | null>(null);
  const [failed, setFailed] = useState(false);

  const shouldLoad = active && (eager || inView);

  useEffect(() => {
    if (!shouldLoad || payload || failed) return;

    const controller = new AbortController();
    fetchCardPayload(follower.username, controller.signal)
      .then(setPayload)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFailed(true);
      });

    return () => controller.abort();
  }, [shouldLoad, follower.username, payload, failed]);

  const faceUrl = `/api/card/${encodeURIComponent(follower.username)}/face`;

  return (
    <div className="tcg-pocket__card" ref={ref}>
      {payload ? (
        <PokemonCard
          card={payload.card}
          variant={payload.variant}
          faceUrl={faceUrl}
          pocket
          pageUrl={`/${encodeURIComponent(follower.username)}`}
          imagePriority="low"
          imageLoading="lazy"
        />
      ) : (
        <div
          className={`tcg-pocket__skeleton tcg-card-back${failed ? " tcg-pocket__skeleton--error" : ""}`}
          aria-label={`Loading card for ${follower.username}`}
          aria-busy={!failed}
        />
      )}
    </div>
  );
}
