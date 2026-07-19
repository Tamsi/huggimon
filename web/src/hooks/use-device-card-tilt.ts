"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  beta: number,
  gamma: number,
  baseBeta: number,
  baseGamma: number,
): { px: number; py: number } {
  const px = clamp(50 + (gamma - baseGamma) * 0.9, 4, 96);
  const py = clamp(50 + (beta - baseBeta) * 0.8, 4, 96);
  return { px, py };
}

function motionToPointer(
  x: number,
  y: number,
  baseX: number,
  baseY: number,
): { px: number; py: number } {
  const px = clamp(50 + (x - baseX) * 5.5, 4, 96);
  const py = clamp(50 + (baseY - y) * 5.5, 4, 96);
  return { px, py };
}

function needsExplicitOrientationPermission(): boolean {
  if (typeof window === "undefined") return false;
  const ctor = DeviceOrientationEvent as DeviceOrientationEventWithPermission;
  return typeof ctor.requestPermission === "function";
}

function hasMotionSensors(): boolean {
  if (typeof window === "undefined") return false;
  return "DeviceOrientationEvent" in window || "DeviceMotionEvent" in window;
}

function canUseCoarsePointerTilt(): boolean {
  if (typeof window === "undefined") return false;
  if (!hasMotionSensors()) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    "ontouchstart" in window
  );
}

function probeDeviceTiltPermission(): DeviceTiltPermission {
  if (typeof window === "undefined") return "unknown";
  if (!canUseCoarsePointerTilt()) return "unsupported";
  if (!needsExplicitOrientationPermission()) return "granted";
  return "unknown";
}

const subscribeNoop = () => () => {};

export function useDeviceCardTilt({ enabled, onInteract }: Options) {
  const [userPermission, setUserPermission] = useState<DeviceTiltPermission | null>(
    null,
  );
  const probedPermission = useSyncExternalStore(
    subscribeNoop,
    probeDeviceTiltPermission,
    () => "unknown" as DeviceTiltPermission,
  );
  const permission: DeviceTiltPermission =
    userPermission ?? (enabled ? probedPermission : "unknown");
  const pointerDownRef = useRef(false);
  const enabledRef = useRef(enabled);
  const permissionRef = useRef(permission);
  const onInteractRef = useRef(onInteract);
  const orientationActiveRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    permissionRef.current = permission;
  }, [permission]);

  useEffect(() => {
    onInteractRef.current = onInteract;
  }, [onInteract]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!canUseCoarsePointerTilt()) {
      setUserPermission("unsupported");
      return false;
    }

    const ctor = DeviceOrientationEvent as DeviceOrientationEventWithPermission;
    if (typeof ctor.requestPermission === "function") {
      try {
        const state = await ctor.requestPermission();
        const granted = state === "granted";
        setUserPermission(granted ? "granted" : "denied");
        return granted;
      } catch {
        setUserPermission("denied");
        return false;
      }
    }

    setUserPermission("granted");
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (permission !== "granted") return;

    orientationActiveRef.current = false;

    const baseline = {
      beta: 0,
      gamma: 0,
      motionX: 0,
      motionY: 0,
      orientation: false,
      motion: false,
    };

    const emit = (px: number, py: number) => {
      if (!enabledRef.current) return;
      if (pointerDownRef.current) return;
      if (permissionRef.current !== "granted") return;
      onInteractRef.current(px, py);
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      if (beta == null || gamma == null || Number.isNaN(beta) || Number.isNaN(gamma)) {
        return;
      }

      if (!baseline.orientation) {
        baseline.beta = beta;
        baseline.gamma = gamma;
        baseline.orientation = true;
      }

      orientationActiveRef.current = true;
      const point = orientationToPointer(beta, gamma, baseline.beta, baseline.gamma);
      emit(point.px, point.py);
    };

    const onMotion = (event: DeviceMotionEvent) => {
      if (orientationActiveRef.current) return;

      const gravity = event.accelerationIncludingGravity;
      if (!gravity || gravity.x == null || gravity.y == null) return;

      if (!baseline.motion) {
        baseline.motionX = gravity.x;
        baseline.motionY = gravity.y;
        baseline.motion = true;
      }

      const point = motionToPointer(
        gravity.x,
        gravity.y,
        baseline.motionX,
        baseline.motionY,
      );
      emit(point.px, point.py);
    };

    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("deviceorientationabsolute", onOrientation);
    window.addEventListener("devicemotion", onMotion);

    return () => {
      orientationActiveRef.current = false;
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("deviceorientationabsolute", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
    };
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
