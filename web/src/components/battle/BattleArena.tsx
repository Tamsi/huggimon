"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BattleDialogue } from "@/components/battle/BattleDialogue";
import { BattleHud } from "@/components/battle/BattleHud";
import type { BattleEvent, BattleResult } from "@/lib/battle-types";

const TICK_MS = 1500;

function linesForEvent(result: BattleResult, event: BattleEvent): string[] {
  const name = (actor: "challenger" | "opponent") => result[actor].card.displayName;

  switch (event.type) {
    case "start":
      return [`${name("opponent")} wants to battle!`];
    case "move": {
      const lines = [`${name(event.actor)} used ${event.move}!`];
      if (event.effective === "super") lines.push("It's super effective!");
      if (event.effective === "not_very") lines.push("It's not very effective...");
      return lines;
    }
    case "faint":
      return [`${name(event.actor)} fainted!`];
    case "end":
      return [`${name(event.winner)} won the battle!`];
  }
}

type Props = {
  result: BattleResult;
  onRematch: () => void;
};

export function BattleArena({ result, onRematch }: Props) {
  const [index, setIndex] = useState(0);
  const [hp, setHp] = useState({
    challenger: result.challenger.maxHp,
    opponent: result.opponent.maxHp,
  });
  const done = index >= result.events.length - 1;
  const event = result.events[Math.min(index, result.events.length - 1)]!;
  const lines = useMemo(() => linesForEvent(result, event), [result, event]);

  useEffect(() => {
    if (done) return;

    const timeout = window.setTimeout(() => {
      const next = result.events[index + 1];
      if (!next) return;
      if (next.type === "move") setHp(next.hpAfter);
      setIndex((currentIndex) => currentIndex + 1);
    }, TICK_MS);

    return () => window.clearTimeout(timeout);
  }, [done, index, result.events]);

  function skip() {
    const lastMove = [...result.events].reverse().find((currentEvent) => currentEvent.type === "move");
    if (lastMove && lastMove.type === "move") setHp(lastMove.hpAfter);
    setIndex(result.events.length - 1);
  }

  return (
    <div className="battle-arena">
      <BattleHud opponent={result.opponent} challenger={result.challenger} hp={hp} />
      <BattleDialogue lines={lines} showSkip={!done} onSkip={skip} />
      {done && (
        <div className="battle-end">
          <button type="button" className="battle-btn" onClick={onRematch}>
            Rematch
          </button>
          <Link
            href={`/${encodeURIComponent(result.challenger.card.username)}`}
            className="battle-btn battle-btn--ghost"
          >
            Back to profile
          </Link>
        </div>
      )}
    </div>
  );
}
