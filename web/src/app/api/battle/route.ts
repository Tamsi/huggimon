import { NextResponse } from "next/server";
import { simulateBattle } from "@/lib/battle-engine";
import { loadBattleCards, newBattleSeed, normalizeUsername } from "@/lib/battle-load";

function errorResponse(error: unknown) {
  const status =
    typeof error === "object" &&
    error &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : 500;
  const message = error instanceof Error ? error.message : "Battle failed";
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { challenger?: string; opponent?: string };
    const { challenger, opponent } = await loadBattleCards(
      body.challenger ?? "",
      body.opponent ?? "",
    );
    const seed = newBattleSeed();
    const result = simulateBattle(challenger, opponent, seed);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const a = url.searchParams.get("a") ?? "";
    const b = url.searchParams.get("b") ?? "";
    const seed = url.searchParams.get("seed") ?? "";
    if (!seed.trim()) {
      return NextResponse.json({ error: "Seed required" }, { status: 400 });
    }
    if (!normalizeUsername(a) || !normalizeUsername(b)) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }
    const { challenger, opponent } = await loadBattleCards(a, b);
    const result = simulateBattle(challenger, opponent, seed.trim());
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
