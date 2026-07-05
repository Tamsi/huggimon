"use client";

import { useSpring, to } from "@react-spring/web";
import { useCallback, useState } from "react";
import { clamp, round } from "@/lib/math";

const SPRING = { stiffness: 0.066, damping: 0.25 };

export function useTrainerCardTilt(enabled: boolean) {
  const [interacting, setInteracting] = useState(false);
  const [springs, api] = useSpring(() => ({
    rx: 0,
    ry: 0,
    px: 62,
    py: 38,
    config: SPRING,
  }));

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!enabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = clamp(round((100 / rect.width) * (e.clientX - rect.left)), 0, 100);
      const py = clamp(round((100 / rect.height) * (e.clientY - rect.top)), 0, 100);
      setInteracting(true);
      api.start({
        px,
        py,
        rx: round((py - 50) / 3.5),
        ry: round(-(px - 50) / 3.5),
        config: SPRING,
      });
    },
    [enabled, api],
  );

  const onPointerLeave = useCallback(() => {
    setInteracting(false);
    api.start({ rx: 0, ry: 0, px: 62, py: 38, config: SPRING });
  }, [api]);

  const tiltStyle = {
    transform: to(
      [springs.rx, springs.ry],
      (rx, ry) => `perspective(520px) rotateX(${rx}deg) rotateY(${ry}deg)`,
    ),
    "--hpkt-holo-x": springs.px.to((v) => `${v}%`),
    "--hpkt-holo-y": springs.py.to((v) => `${v}%`),
  } as Record<string, unknown>;

  return {
    interacting,
    tiltStyle,
    onPointerMove,
    onPointerLeave,
    setInteracting,
    api,
  };
}
