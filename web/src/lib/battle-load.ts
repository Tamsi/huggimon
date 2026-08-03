import { fetchHfProfile } from "./hf-fetcher";
import { buildCard, type CardData } from "./scoring";

/** Trim + strip @, preserve HF username casing (author queries are case-sensitive). */
export function cleanUsername(raw: string): string {
  return raw.trim().replace(/^@/, "");
}

export function usernamesEqual(a: string, b: string): boolean {
  return cleanUsername(a).toLowerCase() === cleanUsername(b).toLowerCase();
}

export function normalizeUsername(raw: string): string {
  return cleanUsername(raw);
}

export async function loadBattleCards(
  challengerRaw: string,
  opponentRaw: string,
): Promise<{ challenger: CardData; opponent: CardData }> {
  const challengerName = cleanUsername(challengerRaw);
  const opponentName = cleanUsername(opponentRaw);

  if (!challengerName || !opponentName) {
    throw Object.assign(new Error("Username required"), { status: 400 });
  }
  if (usernamesEqual(challengerName, opponentName)) {
    throw Object.assign(new Error("Choose a different opponent"), { status: 400 });
  }

  const loadOne = async (name: string) => {
    try {
      return buildCard(await fetchHfProfile(name));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Not found";
      if (/not found/i.test(msg)) {
        throw Object.assign(new Error("Trainer not found"), { status: 404 });
      }
      throw Object.assign(new Error("Trainer data unavailable"), { status: 502 });
    }
  };

  const [challenger, opponent] = await Promise.all([
    loadOne(challengerName),
    loadOne(opponentName),
  ]);
  return { challenger, opponent };
}

export function newBattleSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
