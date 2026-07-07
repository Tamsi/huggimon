"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/math";

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

export type DeviceTiltPermission = "unknown" | "granted" | "denied" | "unsupported";

type Options = {
  enabled: boolean;
  onInteract: (px: number, py: number) => void;
};

function orientationToPointer(
  beta: number | null,
  gamma: number | null,
): { px: number; py: number } | null {
  if (beta == null || gamma == null || Number.isNaN(beta) || Number.isNaN(gamma)) {
    return null;
  }

  // Portrait hold: gamma = left/right, beta = forward/back (≈45° when flat on a table).
  const px = clamp(50 + gamma * 0.9, 4, 96);
  const py = clamp(50 + (beta - 45) * 0.8, 4, 96);
  return { px, py };
}

function needsExplicitOrientationPermission(): boolean {
  if (typeof window === "undefined") return false;
  const ctor = DeviceOrientationEvent as DeviceOrientationEventWithPermission;
  return typeof ctor.requestPermission === "function";
}

function canUseCoarsePointerTilt(): boolean {
  if (typeof window === "undefined") return false;
  if (!("DeviceOrientationEvent" in window)) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    "ontouchstart" in window
  );
}

export function useDeviceCardTilt({ enabled, onInteract }: Options) {
  const [permission, setPermission] = useState<DeviceTiltPermission>("unknown");
  const pointerDownRef = useRef(false);
  const enabledRef = useRef(enabled);
  const permissionRef = useRef(permission);
  const onInteractRef = useRef(onInteract);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    permissionRef.current = permission;
  }, [permission]);

  useEffect(() => {
    onInteractRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    if (!enabled) return;
    if (!canUseCoarsePointerTilt()) {
      setPermission("unsupported");
      return;
    }
    if (!needsExplicitOrientationPermission()) {
      setPermission("granted");
    }
  }, [enabled]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!canUseCoarsePointerTilt()) {
      setPermission("unsupported");
      return false;
    }

    const ctor = DeviceOrientationEvent as DeviceOrientationEventWithPermission;
    if (typeof ctor.requestPermission !== "function") {
      setPermission("granted");
      return true;
    }

    try {
      const state = await ctor.requestPermission();
      const granted = state === "granted";
      setPermission(granted ? "granted" : "denied");
      return granted;
    } catch {
      setPermission("denied");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (permission !== "granted") return;

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (!enabledRef.current) return;
      if (pointerDownRef.current) return;
      if (permissionRef.current !== "granted") return;

      const point = orientationToPointer(event.beta, event.gamma);
      if (!point) return;
      onInteractRef.current(point.px, point.py);
    };

    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [enabled, permission]);

  const onPointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const onPointerUp = useCallback(() => {
    pointerDownRef.current = false;
  }, []);

  const prepareOnGesture = useCallback(async () => {
    if (permissionRef.current === "granted") return true;
    if (permissionRef.current === "denied" || permissionRef.current === "unsupported") {
      return false;
    }
    return requestPermission();
  }, [requestPermission]);

  return {
    permission,
    needsPermissionPrompt:
      permission === "unknown" && needsExplicitOrientationPermission(),
    onPointerDown,
    onPointerUp,
    prepareOnGesture,
  };
}
