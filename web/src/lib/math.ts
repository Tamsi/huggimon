export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function round(n: number): number {
  return Math.round(n);
}

export function adjust(
  v: number,
  fmin: number,
  fmax: number,
  tmin: number,
  tmax: number,
): number {
  return tmin + ((tmax - tmin) * (v - fmin)) / (fmax - fmin);
}
