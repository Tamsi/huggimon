import { fetchHfProfile } from "./hf-fetcher";
import { buildCard, type CardData } from "./scoring";

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export async function loadBattleCards(
  challengerRaw: string,
  opponentRaw: string,
): Promise<{ challenger: CardData; opponent: CardData }> {
  const challengerName = normalizeUsername(challengerRaw);
  const opponentName = normalizeUsername(opponentRaw);

  if (!challengerName || !opponentName) {
    throw Object.assign(new Error("Username required"), { status: 400 });
  }
  if (challengerName === opponentName) {
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
