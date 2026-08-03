"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BattleArena } from "@/components/battle/BattleArena";
import type { BattleResult } from "@/lib/battle-types";

export function BattleClient() {
  const params = useSearchParams();
  const router = useRouter();
  const a = (params.get("a") ?? "").trim();
  const b = (params.get("b") ?? "").trim();
  const seed = (params.get("seed") ?? "").trim();

  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftA, setDraftA] = useState(a);
  const [draftB, setDraftB] = useState(b);

  const runBattle = useCallback(
    async (challenger: string, opponent: string, replaySeed?: string) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        let data: BattleResult;

        if (replaySeed) {
          const response = await fetch(
            `/api/battle?a=${encodeURIComponent(challenger)}&b=${encodeURIComponent(opponent)}&seed=${encodeURIComponent(replaySeed)}`,
          );
          const json = (await response.json()) as BattleResult & { error?: string };
          if (!response.ok) throw new Error(json.error ?? "Battle failed");
          data = json;
        } else {
          const response = await fetch("/api/battle", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ challenger, opponent }),
          });
          const json = (await response.json()) as BattleResult & { error?: string };
          if (!response.ok) throw new Error(json.error ?? "Battle failed");
          data = json;
          router.replace(
            `/battle?a=${encodeURIComponent(challenger)}&b=${encodeURIComponent(opponent)}&seed=${encodeURIComponent(data.seed)}`,
          );
        }

        setResult(data);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Battle failed");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!a || !b) return;
    if (seed && result?.seed === seed) return;

    const timeout = window.setTimeout(() => {
      void runBattle(a, b, seed || undefined);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [a, b, seed, result?.seed, runBattle]);

  if (!a || !b) {
    return (
      <form
        className="battle-empty"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(`/battle?a=${encodeURIComponent(draftA.trim())}&b=${encodeURIComponent(draftB.trim())}`);
        }}
      >
        <h1>Trainer Battle</h1>
        <label>
          Challenger
          <input value={draftA} onChange={(event) => setDraftA(event.target.value)} required />
        </label>
        <label>
          Opponent
          <input value={draftB} onChange={(event) => setDraftB(event.target.value)} required />
        </label>
        <button type="submit" className="battle-btn">
          Fight!
        </button>
      </form>
    );
  }

  if (loading && !result) {
    return <p className="battle-loading">Trainer {b} would like to battle!</p>;
  }

  if (error) {
    return (
      <div className="battle-error">
        <p>{error}</p>
        <button type="button" className="battle-btn" onClick={() => void runBattle(a, b)}>
          Try again
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <BattleArena
      key={result.seed}
      result={result}
      onRematch={() => {
        router.replace(`/battle?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
      }}
    />
  );
}
