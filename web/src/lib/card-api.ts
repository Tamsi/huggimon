import type { CardVariant } from "./card-variant";
import type { CardData } from "./scoring";

export type CardApiPayload = {
  card: CardData;
  variant: CardVariant;
};

export async function fetchCardPayload(
  username: string,
  signal?: AbortSignal,
): Promise<CardApiPayload> {
  const res = await fetch(`/api/card/${encodeURIComponent(username)}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Card fetch failed (${res.status})`);
  }
  return res.json() as Promise<CardApiPayload>;
}
