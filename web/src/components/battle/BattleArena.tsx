"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BattleDialogue } from "@/components/battle/BattleDialogue";
import { BattleHud } from "@/components/battle/BattleHud";
import { buildBattleScript, type BattleFx } from "@/lib/battle-script";
import type { BattleResult } from "@/lib/battle-types";

type Props = {
  result: BattleResult;
  onRematch: () => void;
};

export function BattleArena({ result, onRematch }: Props) {
  const script = useMemo(() => buildBattleScript(result), [result]);
  const [beatIndex, setBeatIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [fx, setFx] = useState<BattleFx>("idle");
  const [fainted, setFainted] = useState<{ challenger: boolean; opponent: boolean }>({
    challenger: false,
    opponent: false,
  });
  const [hp, setHp] = useState({
    challenger: result.challenger.maxHp,
    opponent: result.opponent.maxHp,
  });

  const beat = script[Math.min(beatIndex, script.length - 1)]!;
  const done = beatIndex >= script.length - 1 && typingDone;

  const onTypingDone = useCallback(() => {
    setTypingDone(true);
  }, []);

  // Apply beat side-effects when the beat changes
  useEffect(() => {
    setTypingDone(false);
    setFx(beat.fx);
    if (beat.hpAfter) setHp(beat.hpAfter);
    if (beat.fx === "faint-opponent") {
      setFainted((f) => ({ ...f, opponent: true }));
    }
    if (beat.fx === "faint-challenger") {
      setFainted((f) => ({ ...f, challenger: true }));
    }

    if (beat.fx.startsWith("hit-")) {
      const clear = window.setTimeout(() => setFx("idle"), 480);
      return () => window.clearTimeout(clear);
    }
    return undefined;
  }, [beat]);

  // Advance after typing + hold
  useEffect(() => {
    if (!typingDone || done) return;
    const hold = window.setTimeout(() => {
      setBeatIndex((i) => Math.min(i + 1, script.length - 1));
    }, Math.max(400, beat.holdMs - beat.text.length * 28));
    return () => window.clearTimeout(hold);
  }, [typingDone, done, beat.holdMs, beat.text.length, script.length]);

  function skip() {
    const lastHp = [...script].reverse().find((b) => b.hpAfter)?.hpAfter;
    if (lastHp) setHp(lastHp);
    setFainted({
      opponent: script.some((b) => b.fx === "faint-opponent"),
      challenger: script.some((b) => b.fx === "faint-challenger"),
    });
    setFx("idle");
    setBeatIndex(script.length - 1);
    setTypingDone(true);
  }

  return (
    <div className="battle-arena">
      <BattleHud
        opponent={result.opponent}
        challenger={result.challenger}
        hp={hp}
        fx={fx}
        fainted={fainted}
      />
      <BattleDialogue
        text={beat.text}
        showRun={!done}
        onRun={skip}
        typingDone={typingDone}
        onTypingDone={onTypingDone}
      />
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
