"use client";

import type { BattleFx } from "@/lib/battle-script";
import type { BattleFighterPublic } from "@/lib/battle-types";

type Props = {
  opponent: BattleFighterPublic;
  challenger: BattleFighterPublic;
  hp: { challenger: number; opponent: number };
  fx: BattleFx;
  fainted: { challenger: boolean; opponent: boolean };
};

function hpClass(ratio: number): string {
  if (ratio <= 0.2) return "battle-hp__fill battle-hp__fill--critical";
  if (ratio <= 0.5) return "battle-hp__fill battle-hp__fill--low";
  return "battle-hp__fill";
}

function Sprite({
  fighter,
  side,
  fx,
  isFainted,
}: {
  fighter: BattleFighterPublic;
  side: "challenger" | "opponent";
  fx: BattleFx;
  isFainted: boolean;
}) {
  const avatar = fighter.card.avatarUrl;
  const hit =
    !isFainted &&
    ((fx === "hit-opponent" && side === "opponent") ||
      (fx === "hit-challenger" && side === "challenger"));
  const faint = isFainted;
  const send = !isFainted && fx === "send-out" && side === "challenger";

  const wrapClass = [
    "battle-sprite-wrap",
    hit ? "battle-sprite-wrap--hit" : "",
    faint ? "battle-sprite-wrap--faint" : "",
    send ? "battle-sprite-wrap--send" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`battle-slot battle-slot--${side}`}>
      <div className={wrapClass}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            className={`battle-sprite${side === "challenger" ? " battle-sprite--back" : ""}`}
          />
        ) : (
          <div
            className={`battle-sprite battle-sprite--placeholder${
              side === "challenger" ? " battle-sprite--back" : ""
            }`}
            aria-hidden
          >
            ◉
          </div>
        )}
      </div>
      <div className="battle-platform" aria-hidden />
    </div>
  );
}

function StatusPlate({
  fighter,
  currentHp,
  side,
  showNumbers,
}: {
  fighter: BattleFighterPublic;
  currentHp: number;
  side: "challenger" | "opponent";
  showNumbers: boolean;
}) {
  const ratio = fighter.maxHp <= 0 ? 0 : Math.max(0, currentHp) / fighter.maxHp;
  const expPct = Math.min(100, (fighter.card.level % 10) * 10 + 15);

  return (
    <div className={`battle-plate battle-plate--${side}`}>
      <div className="battle-plate__row">
        <span className="battle-plate__name">{fighter.card.displayName}</span>
        <span className="battle-plate__lv">Lv{fighter.card.level}</span>
      </div>
      <div className="battle-hp">
        <div className="battle-hp__label-row">
          <span className="battle-hp__tag">HP</span>
          <div className="battle-hp__track">
            <div className={hpClass(ratio)} style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>
        {showNumbers && (
          <div className="battle-hp__numbers">
            {Math.max(0, currentHp)}/{fighter.maxHp}
          </div>
        )}
      </div>
      {side === "challenger" && (
        <div className="battle-exp" aria-hidden>
          <div className="battle-exp__fill" style={{ width: `${expPct}%` }} />
        </div>
      )}
    </div>
  );
}

export function BattleHud({ opponent, challenger, hp, fx, fainted }: Props) {
  return (
    <div className="battle-field">
      <StatusPlate
        fighter={opponent}
        currentHp={hp.opponent}
        side="opponent"
        showNumbers={false}
      />
      <Sprite
        fighter={opponent}
        side="opponent"
        fx={fx}
        isFainted={fainted.opponent}
      />
      <Sprite
        fighter={challenger}
        side="challenger"
        fx={fx}
        isFainted={fainted.challenger}
      />
      <StatusPlate
        fighter={challenger}
        currentHp={hp.challenger}
        side="challenger"
        showNumbers
      />
    </div>
  );
}
